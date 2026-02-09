import { WebSocketServer } from "ws";
import { Chat, Content, Part } from "@google/genai";
import { createNewChat, sendPrompt, baseSystemInstruction } from "../ai/ai";
import { marked } from "marked";
import { chatDbType, SearchResultEntry } from "../common";
import ENV from "../../ENV/ENV";
import { createClient } from '@supabase/supabase-js';
import { fetchEvents } from "../ai/eventsFeature";

// ----------------------------- USEFUL FUNCTIONS ---------------------------
function convertToParts(arr: { role: string, message: string }[]): Content[] {
    const parts: Content[] = [];
    arr?.forEach((el) => {
        const partArr: Part[] = [{ text: el.message }];
        const obj: Content = { role: el.role, parts: partArr };
        parts.push(obj);
    });
    return parts;
}

async function getFilteredEvents(structuredData: SearchResultEntry[], interests: string[]): Promise<SearchResultEntry[]> {
    const prompt: string = `You are an AI assistant filtering search results for a user based on their specific interests.
    
    USER INTERESTS: [${interests.join(", ")}]
    
    SEARCH DATA:
    ${JSON.stringify(structuredData, null, 2)}
    
    TASK:
    1. Analyze each item in the SEARCH DATA.
    2. Keep only the items that are highly relevant to the USER INTERESTS.
    3. Return the filtered list as a valid JSON array of objects. 
    4. Maintain the exact same structure: {name, place, data, time, url}.
    5. DO NOT include any conversational text, only the JSON array.
    `;

    const response = await sendPrompt(prompt);

    if (!response) {
        return [];
    } else {
        try {
            const cleanedResponse = response.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error("Failed to parse Gemini response:", error);
            return [];
        }
    }
}

function extractSearchDetails(rawData: any): SearchResultEntry[] {
    const place = rawData.search_parameters?.location_used ?? "Unknown Location";
    const time = rawData.search_metadata?.processed_at ?? new Date().toISOString();

    return (rawData.organic_results || []).map((result: any): SearchResultEntry => ({
        name: result.title || "Untitled",
        place: place,
        data: result.snippet || "No description available",
        time: time,
        url: result.link || ""
    }));
}

// ----------------------------------------------  DATABASE CLIENT -----------------
const supabase = createClient(ENV.supabaseUrl, ENV.supabasePublishableKey);

export const wss: WebSocketServer = new WebSocketServer({ noServer: true });

wss.on("connection", async (ws, request) => {
    console.log("Connected to client");

    ws.on("message", async (data) => {
        try {
            const incomingData = JSON.parse(data.toString());
            
            // Handle different message types
            if (incomingData.type === "request-events") {
                // Handle events request
                try {
                    const location: string = incomingData.location;
                    const interests: string[] = incomingData.interests;

                    const eventsResultUnstructured = await fetchEvents(location, interests);
                    const structuredData: SearchResultEntry[] = extractSearchDetails(eventsResultUnstructured);
                    const filtered: SearchResultEntry[] = await getFilteredEvents(structuredData, interests);
                    
                    // Send events back to client
                    ws.send(JSON.stringify({
                        type: "events",
                        data: filtered
                    }));

                } catch (err) {
                    console.log("Error fetching events:", err);
                    ws.send(JSON.stringify({
                        type: "events-error",
                        error: "Failed to fetch events"
                    }));
                }
                return;
            }

            // Handle chat messages
            if (incomingData.type === "chat" || incomingData.chatId) {
                const prompt: string = incomingData.message.message;
                const chatId = incomingData.chatId;

                let chatHistory: Content[] | null = [];

                const { data: histData, error: histErr } = await supabase
                    .from("Chats")
                    .select("messages")
                    .eq("id", chatId)
                    .maybeSingle();

                if (histErr || !histData?.messages) {
                    chatHistory = null;
                } else {
                    chatHistory = convertToParts(histData.messages);
                }

                const systemInstruction = baseSystemInstruction + 
                    ` Remember these details: CHILD_NAME: ${incomingData.message.name} CHILD_INTERESTS: ${incomingData.message.interests} and UPCOMING EVENTS: ${JSON.stringify(incomingData.message.events)}`;

                const chat: Chat = await createNewChat(chatHistory, systemInstruction);

                try {
                    const response = await chat.sendMessage({
                        message: prompt
                    });

                    if (!response) {
                        throw new Error("Could not get response from gemini api");
                    }

                    const raw = response.text;
                    const html = marked.parse(raw) as string;

                    const responseData: chatDbType = { role: "model", message: html };

                    // Save to database
                    const { data: messageArr, error } = await supabase
                        .from("Chats")
                        .select("messages")
                        .eq("id", chatId)
                        .maybeSingle();

                    if (messageArr && !error) {
                        const currentArr = messageArr.messages || [];
                        currentArr.push({ role: incomingData.role, message: incomingData.message.message });
                        currentArr.push(responseData);

                        const { error: upErr } = await supabase
                            .from("Chats")
                            .update({ messages: currentArr })
                            .eq("id", chatId);

                        if (upErr) {
                            throw new Error(upErr.message.toString());
                        }
                    } else {
                        throw new Error(error?.message?.toString() || "Database error");
                    }

                    ws.send(JSON.stringify(responseData));

                } catch (err) {
                    const errorData: chatDbType = { role: "model", message: "Something went wrong." };
                    console.log("Chat error:", err);
                    ws.send(JSON.stringify(errorData));
                }
            }

        } catch (err) {
            console.error("Error processing message:", err);
            ws.send(JSON.stringify({
                type: "error",
                message: "Failed to process message"
            }));
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});
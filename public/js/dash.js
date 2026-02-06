
let socket = null;

function insertMessage(role, message) {

    const parent = document.querySelector(".chat-container");

    const div = document.createElement("div");
    div.classList.add("message");
    div.classList.add(((role === "user") ? "user-message" : "model-message"));

    const messageContent = document.createElement("div");
    messageContent.classList.add("message-content");
    messageContent.textContent = message;
    div.appendChild(messageContent);

    parent.appendChild(div);

    parent.scrollTop = parent.scrollHeight;

}

function connectToServer() {

    console.log("Connecting to server......");

    socket = new WebSocket("ws://localhost:3000/dashboard/chat");

    socket.addEventListener("open", () => {

        console.log("Connected to server");

    });

    socket.addEventListener("message", (event) => {
        try {
            // Parse the JSON data from the WebSocket message
            const data = JSON.parse(event.data);
            const { role, message } = data;
            insertMessage(role, message);
        } catch (error) {
            // If it's not JSON, treat it as plain text
            console.error("Error parsing message:", error);
            insertMessage("model", event.data);
        }
    });

    socket.addEventListener("close", () => {
        console.log("Disconnected from server");
        socket = null;
    });

    socket.addEventListener("error", (err) => {
        console.error("Socket error:", err);
    });
}




function sendPrompt() {


    const input = document.querySelector("#name-input");
    const prompt = input.value.trim();

    if(prompt){
        
        if (!socket || (socket.readyState !== WebSocket.OPEN) ) {

            connectToServer();

            // waiting for connection
            const sendOnOpen = () =>{

                socket.send(prompt);
                insertMessage("user", prompt);
                input.textContent = ''; // Clear input after sending

            };

            if(socket.readyState === WebSocket.CONNECTING){
                socket.addEventListener('open', sendOnOpen, {once: true});
            }else if(socket.readyState === WebSocket.OPEN){
                sendOnOpen();
            }

        }else {

            socket.send(prompt);
            insertMessage("user", prompt);
            input.value = "";

        }
    }
   
    

}

// const supabase = getSupabase();

document.addEventListener("DOMContentLoaded", () => {

    document.addEventListener('click', function (event) {
        console.log('h');
        const accountSection = document.querySelector('.account-section');
        if (accountSection && !accountSection.contains(event.target)) {
            document.getElementById('dropdownMenu')?.classList.remove('active');
            document.getElementById('accountBtn')?.classList.remove('active');
        }
    });

    const btn = document.getElementById('accountBtn');
    if (btn) btn.classList.add('collapsed');

    const form = document.querySelector("#chat-form");
    form.addEventListener("submit", (event) => {
        
        event.preventDefault();
        sendPrompt(event);
    });
    //connecting to server
    connectToServer();
});



// event handler for syllabus button
async function selectSyllabus() {

    // if clicked then use the olevel and alevel syllabi to create a list of topic year by year to use for the parent

}

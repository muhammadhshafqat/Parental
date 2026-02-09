import { Router, Request, Response, NextFunction } from "express";
import * as appTypes from "../utils/common";
import { createClient } from "../utils/database/server-database";
import { Chat, Content, Part } from "@google/genai";

const dashRouter: Router = Router();

// ----------------------------------- FUNCTIONS ------------------------------ //

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
	const supabase = createClient({ req, res });
	const { data, error } = await supabase.auth.getUser();

	if (error || !data?.user) {
		res.redirect('/login');
		return;
	} else {
		req.user = data.user;
		next();
	}
}

// Improved event fetching with fallback strategies
async function fetchEventsFromSerpAPI(location: string, interests: string[] = []): Promise<any[]> {
	const apiKey = process.env.SERPAPI_KEY || "2319c8094417aed7ed7e1dc5e8c6728a347ce5aed0a7f8731652f25f7dd6ad41";
	
	// Strategy 1: Try with most relevant interests (max 2)
	let events: any[] = [];
	
	// First try: Location + top 2 interests
	if (interests.length > 0) {
		const topInterests = interests.slice(0, 2);
		const query1 = `${location} ${topInterests.join(" ")} events`;
		console.log("Trying query 1:", query1);
		events = await queryEvents(apiKey, query1);
	}
	
	if (events.length === 0) {
		const query2 = `${location} events`;
		console.log("Trying query 2:", query2);
		events = await queryEvents(apiKey, query2);
	}
	
	// Third try: Just location events (broadest search)
	if (events.length === 0) {
		const query3 = `${location} events`;
		console.log("Trying query 3:", query3);
		events = await queryEvents(apiKey, query3);
	}
	
	// Fourth try: Try individual interests one by one
	if (events.length === 0 && interests.length > 0) {
		for (const interest of interests.slice(0, 3)) {
			const query4 = `${location} ${interest}`;
			console.log("Trying query 4:", query4);
			events = await queryEvents(apiKey, query4);
			if (events.length > 0) break;
		}
	}
	
	return events;
}

async function queryEvents(apiKey: string, query: string): Promise<any[]> {
	const url = `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(query)}&hl=en&gl=us&api_key=${apiKey}`;
	
	try {
		const response = await fetch(url);
		const data: any = await response.json();
		
		console.log(`Query: "${query}" - Status:`, data.search_information?.events_results_state);
		
		if (data.events_results && Array.isArray(data.events_results) && data.events_results.length > 0) {
			return data.events_results.map((event: any) => {
				// Log the raw date data from SerpAPI
				console.log("Raw event date data:", {
					title: event.title,
					start_date: event.date?.start_date,
					when: event.date?.when,
					full_date_object: event.date
				});
				
				let dateStr = event.date?.start_date || event.date?.when || 'Date TBD';
				
				// Add year if it's missing (e.g., "Feb 9" -> "Feb 9, 2026")
				if (dateStr && dateStr !== 'Date TBD' && !dateStr.match(/\d{4}/)) {
					const currentYear = new Date().getFullYear();
					dateStr = `${dateStr}, ${currentYear}`;
				}
				
				return {
					title: event.title || 'Untitled Event',
					date: dateStr,
					address: event.address || event.venue?.name || 'Location TBD',
					link: event.link || null,
					thumbnail: event.thumbnail || null,
					venue: event.venue?.name || null,
					description: event.description || null
				};
			});
		}
		
		return [];
	} catch (error) {
		console.error("Error querying events:", error);
		return [];
	}
}

dashRouter.use(requireAuth);

// Dashboard main page – fetch children + events for logged-in user
dashRouter.get("/", async (req: Request, res: Response) => {
	const supabase = createClient({ req, res });

	try {
		// Get logged-in auth user
		const { data: userData, error: userErr } = await supabase.auth.getUser();

		if (userErr) {
			console.error("Error getting user:", userErr);
			return res.status(500).send("Server error");
		}

		const userId = userData?.user?.id;

		// Fetch row from users table
		let userRow = null;

		if (userId) {
			const { data: dbUser, error: dbErr } = await supabase
				.from("users")
				.select("id, name, email")
				.eq("id", userId)
				.single();

			if (dbErr) {
				console.error("Error fetching user row:", dbErr);
			} else {
				userRow = dbUser;
			}
		}

		let children: any[] = [];

		if (userId) {
			const { data: ucData, error: ucError } = await supabase
				.from("UserChildren")
				.select("child_id, Children(id, name, age, interests)")
				.eq("user_id", userId);

			if (ucError) {
				console.error("Error fetching UserChildren:", ucError);
			} else if (ucData) {
				children = ucData
					.map((row: any) => row.Children)
					.filter(Boolean)
					.map((c: any) => ({
						id: c.id,
						name: c.name,
						age: c.age,
						interests: Array.isArray(c.interests)
							? c.interests
							: c.interests
								? [c.interests]
								: [],
						events: [],
						chatId: null,
						chatHistory: []
					}));

				// Fetch events for each child
				for (const child of children) {
					try {
						const { data: ceData, error: ceError } = await supabase
							.from("ChildrenEvents")
							.select("Events(id, name, location, time, link)")
							.eq("child_id", child.id);

						if (ceError) {
							console.error(`Error fetching events for child ${child.id}:`, ceError);
							child.events = [];
						} else if (ceData) {
							child.events = ceData
								.map((r: any) => r.Events)
								.filter(Boolean)
								.map((ev: any) => ({
									id: ev.id,
									name: ev.name,
									location: ev.location,
									link:ev.link,
									time: ev.time || 'Date TBD',
								}));
						} else {
							child.events = [];
						}

						let { data: chat, error } = await supabase
							.from("Chats")
							.select("id, messages")
							.eq("child_id", child.id)
							.maybeSingle();

						if (!chat && !error) {
							const { data: newChat, error: insertError } = await supabase
								.from("Chats")
								.insert({ child_id: child.id })
								.select("id, messages")
								.single();

							chat = newChat;
							error = insertError;
						}

						if (chat) {
							child.chatId = chat.id;
							child.chatHistory = chat.messages || [];
						}

					} catch (innerErr) {
						console.error("Inner error fetching child's data:", innerErr);
						child.events = [];
					}
				}
			}
		}

		// Popular cities for dropdown
		const popularCities = [
			"New York, NY",
			"Los Angeles, CA",
			"Chicago, IL",
			"Houston, TX",
			"Phoenix, AZ",
			"Philadelphia, PA",
			"San Antonio, TX",
			"San Diego, CA",
			"Dallas, TX",
			"San Jose, CA",
			"Austin, TX",
			"Jacksonville, FL",
			"Fort Worth, TX",
			"Columbus, OH",
			"Charlotte, NC",
			"San Francisco, CA",
			"Indianapolis, IN",
			"Seattle, WA",
			"Denver, CO",
			"Boston, MA",
			"Miami, FL",
			"Las Vegas, NV",
			"Portland, OR",
			"Detroit, MI",
			"Nashville, TN",
			"Atlanta, GA"
		];

		console.debug("Children prepared for render:", JSON.stringify(children));

		res.render("dashboard", {
			layout: "dashboard-base",
			children,
			firstChild: children.length > 0 ? children[0] : null,
			user: userRow,
			popularCities
		});
	} catch (err) {
		console.error("Dashboard route error:", err);
		try {
			return res.status(500).render("500", { title: "Server Error" });
		} catch (renderErr) {
			console.error("Error rendering 500 view:", renderErr);
			return res.status(500).send("Internal Server Error");
		}
	}
});

// NEW ROUTE: Fetch events based on location and child interests
dashRouter.post("/events/fetch", async (req: Request, res: Response) => {
	const supabase = createClient({ req, res });
	
	try {
		const { location, childId } = req.body;
		
		if (!location) {
			return res.status(400).json({ error: "Location is required" });
		}
		
		let interests: string[] = [];
		
		if (childId) {
			const { data: child, error } = await supabase
				.from("Children")
				.select("interests")
				.eq("id", childId)
				.single();
			
			if (!error && child) {
				interests = Array.isArray(child.interests) 
					? child.interests 
					: child.interests 
						? [child.interests] 
						: [];
			}
		}
		
		console.log(`Fetching events for location: ${location}, interests:`, interests);
		
		// Fetch events with improved fallback logic
		const events = await fetchEventsFromSerpAPI(location, interests);
		
		console.log(`Found ${events.length} events`);
		
		return res.json({ 
			success: true, 
			events,
			location,
			interests 
		});
		
	} catch (error) {
		console.error("Error in /events/fetch:", error);
		return res.status(500).json({ 
			success: false, 
			error: "Failed to fetch events" 
		});
	}
});

// NEW ROUTE: Save selected events to database
// In your dashRouter.ts file, make sure this route exists:
dashRouter.post("/events/save", async (req: Request, res: Response) => {
	const supabase = createClient({ req, res });
	
	try {
		const { childId, events } = req.body;
		
		console.log("=== SAVE EVENTS REQUEST ===");
		console.log("Child ID:", childId);
		console.log("Events count:", events?.length);
		console.log("Events data:", JSON.stringify(events, null, 2));
		
		if (!childId || !Array.isArray(events) || events.length === 0) {
			return res.status(400).json({ 
				success: false,
				error: "Child ID and events array are required" 
			});
		}
		
		// Prepare events for insertion - match database schema exactly
		const eventsToInsert = events.map((event: any) => {
			// Handle location - might be array or string
			let locationStr = 'Location TBD';
			if (Array.isArray(event.location)) {
				locationStr = event.location.filter(Boolean).join(', ');
			} else if (event.location) {
				locationStr = event.location;
			}
			
			const eventData = {
				name: event.name || 'Untitled Event',
				location: locationStr,
				link: event.link,
				time: event.time || 'Date TBD'  // Store as string
			};
			console.log("Prepared event:", eventData);
			return eventData;
		});
		
		console.log("Inserting into Events table...");
		
		const { data: insertedEvents, error: insertError } = await supabase
			.from("Events")
			.insert(eventsToInsert)
			.select();
		
		if (insertError) {
			console.error("Insert error:", insertError);
			return res.status(500).json({ 
				success: false,
				error: "Failed to save events: " + insertError.message,
				details: insertError
			});
		}
		
		console.log("Events inserted successfully:", insertedEvents);
		
		// Link events to child
		if (insertedEvents && insertedEvents.length > 0) {
			const childEventLinks = insertedEvents.map((event: any) => ({
				child_id: childId,
				event_id: event.id
			}));
			
			console.log("Creating links in ChildrenEvents:", childEventLinks);
			
			const { data: linkData, error: linkError } = await supabase
				.from("ChildrenEvents")
				.insert(childEventLinks)
				.select();
			
			if (linkError) {
				console.error("Link error:", linkError);
				// Try to clean up inserted events
				await supabase
					.from("Events")
					.delete()
					.in('id', insertedEvents.map((e: any) => e.id));
				
				return res.status(500).json({ 
					success: false,
					error: "Failed to link events to child: " + linkError.message,
					details: linkError
				});
			}
			
			console.log("Links created successfully:", linkData);
		}
		
		console.log("=== SAVE SUCCESSFUL ===");
		
		return res.json({ 
			success: true, 
			message: "Events saved successfully",
			count: insertedEvents?.length || 0,
			eventIds: insertedEvents?.map((e: any) => e.id) || []
		});
		
	} catch (error) {
		console.error("=== SAVE ERROR ===", error);
		return res.status(500).json({ 
			success: false, 
			error: "Failed to save events: " + (error as Error).message
		});
	}
});
// Chat page
dashRouter.get("/chat", (req: Request, res: Response) => {
	res.render("chat", { layout: "dashboard-base" });
});

dashRouter.post("/chat", (req: Request, res: Response) => {
	res.sendStatus(200);
});

// Show create child form
dashRouter.get("/children", (req: Request, res: Response) => {
	res.render("enterchild", { layout: "dashboard-base", title: "Add Child" });
});

// Handle child creation form submission
dashRouter.post("/children/add", async (req: Request, res: Response) => {
	const supabase = createClient({ req, res });

	try {
		const { data: userData, error: userErr } = await supabase.auth.getUser();
		if (userErr || !userData?.user?.id) {
			console.error("No authenticated user:", userErr);
			return res.status(401).redirect("/login");
		}
		const userId = userData.user.id;
		const userEmail = userData.user.email ?? null;
		const userName =
			userData.user.user_metadata?.full_name ??
			userData.user.user_metadata?.name ??
			null;

		const { data: upsertUser, error: upsertErr } = await supabase
			.from("users")
			.upsert({ id: userId, email: userEmail, name: userName }, { onConflict: "id" })
			.select()
			.single();

		if (upsertErr) {
			console.error("Upsert users row failed:", upsertErr);
			return res
				.status(500)
				.send("Server error creating user record. Check RLS/policies and that the request is authenticated.");
		}

		const { name, dob, interests } = req.body;

		if (!name || !dob) {
			return res.status(400).send("Name and date of birth are required");
		}

		const parsedDob = new Date(dob);
		if (isNaN(parsedDob.getTime())) {
			return res.status(400).send("Invalid date of birth format");
		}
		const today = new Date();
		if (parsedDob > today) {
			return res.status(400).send("Date of birth cannot be in the future");
		}

		const interestsArray = interests
			? interests.split(",").map((i: string) => i.trim()).filter(Boolean)
			: [];

		const { data: child, error: insertErr } = await supabase
			.from("Children")
			.insert([{ name, dob: parsedDob.toISOString().slice(0, 10), interests: interestsArray }])
			.select()
			.single();

		if (insertErr || !child?.id) {
			console.error("Error inserting child:", insertErr);
			return res.status(500).send("Error creating child");
		}

		const { data: linkData, error: linkErr } = await supabase
			.from("UserChildren")
			.insert([{ user_id: userId, child_id: child.id }])
			.select()
			.single();

		if (linkErr) {
			console.error("Error linking child to user:", linkErr);
			try {
				await supabase.from("Children").delete().eq("id", child.id);
				console.debug("Rolled back child insert due to link failure.");
			} catch (delErr) {
				console.error("Failed to rollback child insert:", delErr);
			}
			return res
				.status(500)
				.send("Error linking child to user. Check that a users row exists and RLS/policies allow this operation.");
		}

		return res.redirect("/dashboard");
	} catch (err) {
		console.error("Unexpected error in /children/add:", err);
		return res.status(500).send("Internal Server Error");
	}
});

export default dashRouter;
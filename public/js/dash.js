
let currentChatId = null; // default if no child exists
let socket = null;


// ------------------------------ EVENT FINDING ------------------------ //

// takes the form from createEventForm and displays it
function showEventForm(event) {
    // Prevent the form from trying to submit or the page from reloading
    if(event) event.preventDefault();

    // 1. Create the form using the function logic
    const form = createEventForm(); 

    // 2. Find where you want to put it. 
    // I suggest the dashMainContainer or the aiDiv
    const container = document.getElementById('aiDiv');
    
    // 3. Clear existing form if you don't want duplicates, then add it
    const existing = document.querySelector('.event-finder-form');
    if (existing) existing.remove();
    
    container.prepend(form); // Puts it at the top of the AI section
}

function sendCoords(coords){

	socket.send(JSON.stringify({role: "client-location", message: JSON.stringify(coords)}));

}


function createEventForm() {
	
	// Create Form Container
	const form = document.createElement('form');
	form.className = 'event-finder-form';

	// --- 1. Top Section: Input Group ---
	const inputGroup = document.createElement('div');
	inputGroup.className = 'input-group';

	const locationInput = document.createElement('input');
	locationInput.type = 'text';
	locationInput.placeholder = 'Enter city or address...';
	locationInput.className = 'location-input';

	inputGroup.append(locationInput);

	// --- 2. Bottom Section: Action Buttons ---
	const actionGroup = document.createElement('div');
	actionGroup.className = 'action-group';

	const backBtn = document.createElement('button');
	backBtn.type = 'button'; // Prevent form submission
	backBtn.className = 'back-btn';
	backBtn.textContent = 'Back';
	backBtn.onclick = () => window.location.href='/dashboard';

	const submitBtn = document.createElement('button');
	submitBtn.type = 'submit';
	submitBtn.className = 'submit-btn';
	submitBtn.textContent = 'Find';

	actionGroup.append(backBtn, submitBtn);

	// submission
	form.addEventListener("submit", (event) =>{

		event.preventDefault();

		const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));
		socket.send(JSON.stringify({role: "user-location", message: JSON.stringify({location: locationInput.value, interests: activeChild.interests})}));


	});	

	// Final Assembly
	form.append(inputGroup, actionGroup);
	return form;

}


function renderChatHistory(history) {
	const chatContainer = document.querySelector(".chat-container");
	chatContainer.innerHTML = "";
	if (Array.isArray(history)) {
		history.forEach(msg => insertMessage(msg.role, msg.message));
	}
}

function insertMessage(role, message) {

	const parent = document.querySelector(".chat-container");

	const div = document.createElement("div");
	div.classList.add("message");
	div.classList.add(((role === "user") ? "user-message" : "model-message"));

	const messageContent = document.createElement("div");
	messageContent.classList.add("message-content");
	messageContent.innerHTML = message;
	div.appendChild(messageContent);

	parent.appendChild(div);

	parent.scrollTop = parent.scrollHeight;

}


// ----------------------------------------------- SOCKET FUNCTION ----------------------//

// attempts connecting to the server
function connectToServer() {

	console.log("Connecting to server......");

	socket = new WebSocket("ws://localhost:3000/dashboard/chat");

	socket.addEventListener("open", () => {

		console.log("Connected to server");

	});

	socket.addEventListener("events", (res)=>{

		const data = res.filtered;

		// for each and shit

	});

	socket.addEventListener("events-error", ()=>{


		// show no events

	})

	socket.addEventListener("message", (event) => {
		
		
		try {
			// Parse the JSON data from the WebSocket message
			const data = JSON.parse(event.data);
			const { role, message } = data;

			insertMessage(role, message);

			const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));
			if (activeChild) {
				if (!activeChild.chatHistory) activeChild.chatHistory = [];
				activeChild.chatHistory.push({ role, message });
			}

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

const sendOnOpen = (prompt) => {

	const input = document.querySelector("#name-input");
	if (currentChatId) {
		socket.send(JSON.stringify({ role: "user", message: prompt, chatId: currentChatId }));


		insertMessage("user", prompt);

		const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));
		if (activeChild) {
			if (!activeChild.chatHistory) activeChild.chatHistory = [];
			activeChild.chatHistory.push({ role: "user", message: prompt });
		}

		input.value = ''; // Clear input after sending
	} else {
		insertMessage("user", prompt);
		insertMessage("model", "Cannot answer prompt because no children exist to tie this conversation to.");
		input.value = ""
	}
};


function sendPrompt() {

	const input = document.querySelector("#name-input");
	const prompt = input.value.trim();

	if (prompt) {

		if (!socket || (socket.readyState !== WebSocket.OPEN)) {

			connectToServer();

			if (socket.readyState === WebSocket.CONNECTING) {
				socket.addEventListener('open', sendOnOpen, { once: true });
			} else if (socket.readyState === WebSocket.OPEN) {
				sendOnOpen(prompt);
			}

		} else {
			sendOnOpen(prompt);
		}
	}



}

// const supabase = getSupabase();

document.addEventListener("DOMContentLoaded", () => {

	connectToServer();
	
	const form = document.querySelector("#chat-form");
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		sendPrompt()
	});

	const childButtons = document.querySelectorAll(".name-btn");
	const childNameEl = document.getElementById("childName");
	const childAgeEl = document.getElementById("childAge");
	const childInterestsEl = document.getElementById("childInterests");
	const eventListEl = document.getElementById("eventList");

	// Children data injected from server into a global variable
	// In dashboard.ejs, add: <script>window.childrenData = <%- JSON.stringify(children) %></script>
	const childrenData = window.childrenData || [];

	children = childrenData;

	// current chat id default
	if (childrenData) {
		currentChatId = childrenData[0].chatId;

		renderChatHistory(childrenData[0]?.chatHistory);

	}

	childButtons.forEach((btn) => {
		btn.addEventListener("click", () => {
			// Remove active class from all buttons
			childButtons.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");

			const childId = btn.getAttribute("data-child-id");
			const child = childrenData.find(c => String(c.id) === String(childId));

			if (!child) return;

			currentChatId = btn.getAttribute("data-chat-id");

			// Update child name
			childNameEl.textContent = child.name;

			// Update age with dynamic class
			childAgeEl.textContent = `${child.age} y/o`;
			childAgeEl.className = "age-tag"; // reset
			if (child.age < 13) childAgeEl.classList.add("age-child");
			else if (child.age < 20) childAgeEl.classList.add("age-teen");
			// Update interests
			if (Array.isArray(child.interests) && child.interests.length > 0) {
				// Clear any existing content
				childInterestsEl.innerHTML = "";

				child.interests.forEach(interest => {
					const span = document.createElement("span");
					span.textContent = interest;
					span.classList.add("interest-tag"); // optional class for styling
					childInterestsEl.appendChild(span);
				});
			} else {
				childInterestsEl.textContent = "No interests listed.";
			}


			// Update events
			eventListEl.innerHTML = "";
			if (child.events && child.events.length > 0) {
				child.events.forEach((ev) => {
					const li = document.createElement("li");

					// Google Calendar button
					const a = document.createElement("a");
					a.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.name)}&location=${encodeURIComponent(ev.location)}&dates=${new Date(ev.time).toISOString().replace(/[-:]/g, '').split('.')[0]}/${new Date(ev.time).toISOString().replace(/[-:]/g, '').split('.')[0]}`;
					a.target = "_blank";
					a.rel = "noopener noreferrer";

					const btn = document.createElement("button");
					btn.className = "calendar-btn";
					btn.innerHTML = `<img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" width="18">`;
					a.appendChild(btn);

					li.appendChild(a);

					const dateSpan = document.createElement("span");
					dateSpan.className = "event-date";
					dateSpan.textContent = new Date(ev.time).toLocaleDateString();
					li.appendChild(dateSpan);

					const nameSpan = document.createElement("span");
					nameSpan.className = "event-name";
					nameSpan.textContent = ev.name;
					li.appendChild(nameSpan);

					const placeSpan = document.createElement("span");
					placeSpan.className = "event-place";
					placeSpan.textContent = ev.location;
					li.appendChild(placeSpan);

					eventListEl.appendChild(li);
				});
			} else {
				const li = document.createElement("li");
				li.textContent = "No events yet";
				eventListEl.appendChild(li);
			}

			// render's the chat history releavant to the child
			renderChatHistory(child.chatHistory);

		});
	});
});

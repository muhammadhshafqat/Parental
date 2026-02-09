let currentChatId = null;
let socket = null;
let childrenData = [];
let currentSearchResults = [];

// ------------------------------ EVENT FUNCTIONS ------------------------ //

function renderEvents(events) {
    currentSearchResults = events;
    
    // Hide the search form
    const searchForm = document.querySelector('.event-finder-form');
    if (searchForm) {
        searchForm.style.display = 'none';
    }
    
    const resultsContainer = document.querySelector('.event-search-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = "";
    resultsContainer.style.display = "block";
    
    // Add back to search button
    const backToSearchBtn = document.createElement("button");
    backToSearchBtn.className = "back-to-search-btn";
    backToSearchBtn.textContent = "← New Search";
    backToSearchBtn.onclick = () => {
        resultsContainer.style.display = 'none';
        if (searchForm) searchForm.style.display = 'flex';
    };
    resultsContainer.appendChild(backToSearchBtn);
    
    // Add header showing count
    const header = document.createElement("div");
    header.className = "events-header";
    header.innerHTML = `<h3>🎉 Found ${events.length} Event${events.length !== 1 ? 's' : ''}</h3>`;
    resultsContainer.appendChild(header);
    
    // Create events list
    const eventsList = document.createElement("ul");
    eventsList.className = "search-events-list";
    
    events.forEach((ev, index) => {
        const li = document.createElement("li");
        li.className = "event-item";
        
        const contentDiv = document.createElement("div");
        contentDiv.className = "event-content";
        
        if (ev.thumbnail) {
            const img = document.createElement("img");
            img.src = ev.thumbnail;
            img.alt = ev.title;
            img.className = "event-thumbnail";
            contentDiv.appendChild(img);
        }
        
        const detailsDiv = document.createElement("div");
        detailsDiv.className = "event-details";
        
        const nameSpan = document.createElement("h4");
        nameSpan.className = "event-name";
        nameSpan.textContent = ev.title;
        detailsDiv.appendChild(nameSpan);
        
        const dateSpan = document.createElement("p");
        dateSpan.className = "event-date";
        dateSpan.innerHTML = `📅 ${ev.date || "Date TBD"}`;
        detailsDiv.appendChild(dateSpan);
        
        const placeSpan = document.createElement("p");
        placeSpan.className = "event-place";
        placeSpan.innerHTML = `📍 ${ev.address || "Location TBD"}`;
        detailsDiv.appendChild(placeSpan);
        
        if (ev.link) {
            const linkBtn = document.createElement("a");
            linkBtn.href = ev.link;
            linkBtn.target = "_blank";
            linkBtn.rel = "noopener noreferrer";
            linkBtn.className = "event-link-btn";
            linkBtn.textContent = "More Info";
            detailsDiv.appendChild(linkBtn);
        }
        
        contentDiv.appendChild(detailsDiv);
        li.appendChild(contentDiv);
        
        // Save button for individual event
        const saveBtn = document.createElement("button");
        saveBtn.className = "save-event-btn";
        saveBtn.textContent = "Save";
        saveBtn.dataset.eventIndex = index.toString();
        saveBtn.onclick = async () => {
            await saveSingleEvent(ev, saveBtn);
        };
        li.appendChild(saveBtn);
        
        eventsList.appendChild(li);
    });
    
    resultsContainer.appendChild(eventsList);
    
    // Add save all button at the bottom
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "events-actions";
    
    const saveAllBtn = document.createElement("button");
    saveAllBtn.className = "save-all-events-btn";
    saveAllBtn.textContent = "Save All Events";
    saveAllBtn.onclick = () => saveAllEventsToDatabase(events);
    actionsDiv.appendChild(saveAllBtn);
    
    resultsContainer.appendChild(actionsDiv);
}

function renderNoEvents(message = "No events found for this location. Try a different city or search term.") {
    // Hide the search form
    const searchForm = document.querySelector('.event-finder-form');
    if (searchForm) {
        searchForm.style.display = 'none';
    }
    
    const resultsContainer = document.querySelector('.event-search-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = "";
    resultsContainer.style.display = "block";
    
    // Add back to search button
    const backToSearchBtn = document.createElement("button");
    backToSearchBtn.className = "back-to-search-btn";
    backToSearchBtn.textContent = "← Back to Search";
    backToSearchBtn.onclick = () => {
        resultsContainer.style.display = 'none';
        if (searchForm) searchForm.style.display = 'flex';
    };
    resultsContainer.appendChild(backToSearchBtn);
    
    const noEventsDiv = document.createElement("div");
    noEventsDiv.className = "no-events-message";
    noEventsDiv.innerHTML = `
        <p>😕 ${message}</p>
        <p style="font-size: 0.9em; color: #666;">Try searching for a major city or broader terms.</p>
    `;
    resultsContainer.appendChild(noEventsDiv);
    
    alert(message);
}

// Fetch events from backend
async function fetchEventsFromBackend(location, childId) {
    try {
        const response = await fetch('/dashboard/events/fetch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ location, childId })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log("Events fetch response:", data);
        
        if (data.success && data.events && data.events.length > 0) {
            renderEvents(data.events);
        } else {
            renderNoEvents(`No events found in ${location}. Try a different city or broader search terms.`);
        }
    } catch (error) {
        console.error("Error fetching events:", error);
        renderNoEvents("Failed to fetch events. Please check your internet connection and try again.");
    }
}

// Just return the date string as-is - no parsing needed!
function getEventDateString(dateString) {
    return dateString || "Date TBD";
}

// Parse date ONLY for Google Calendar links (returns null if unparseable)
function parseForCalendar(dateString) {

    if (!dateString || dateString === "Date TBD") return null;
    
    try {
        const lowerDate = dateString.toLowerCase().trim();
        const currentYear = new Date().getFullYear();
        
        // Handle "today"
        if (lowerDate.includes('today')) {
            return new Date();
        }
        
        // Handle "tomorrow"
        if (lowerDate.includes('tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
        }
        
        // Handle month day patterns like "Feb 9", "June 14", etc.
        // Add current year if missing
        let dateToTry = dateString;
        if (!dateString.match(/\d{4}/)) {
            // No year present, add current year
            // Check if it's just "Month Day" format
            if (dateString.match(/^[A-Za-z]{3,9}\s+\d{1,2}$/)) {
                dateToTry = `${dateString}, ${currentYear}`;
            } else {
                // Try appending year
                dateToTry = `${dateString}, ${currentYear}`;
            }
        }
        
        // Try direct parsing
        const parsed = new Date(dateToTry);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
        
        // If that didn't work, try original string
        const parsedOriginal = new Date(dateString);
        if (!isNaN(parsedOriginal.getTime())) {
            return parsedOriginal;
        }
    } catch (e) {
        console.warn("Could not parse for calendar:", dateString);
    }
    
    return null; // If parsing fails, calendar link won't have dates
}

// Save single event to database
async function saveSingleEvent(event, buttonElement) {
    const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));
    
    if (!activeChild) {
        alert("❌ No active child selected");
        return;
    }
    
    buttonElement.disabled = true;
    buttonElement.textContent = "Saving...";
    
    try {
        console.log("Original event data:", event);
        console.log("Original date string:", event.date);

        
        // Format the event data to match database schema
        const eventData = {
            name: event.title || 'Untitled Event',
            location: event.address || event.venue || 'Location TBD',
            link: event.link || "",
            time: getEventDateString(event.date)  // Just store the string as-is
        };
        
        console.log("Formatted event data being saved:", eventData);
        console.log("Date string:", eventData.time);
        
        const response = await fetch('/dashboard/events/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                childId: activeChild.id, 
                events: [eventData]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Save failed:", errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log("Save response:", data);
        
        if (data.success) {
            buttonElement.textContent = "Saved";
            buttonElement.classList.add("saved");
            buttonElement.style.backgroundColor = "#4CAF50";
            buttonElement.style.color = "white";
            
            showToast(`Event saved to ${activeChild.name}'s profile!`);
            
            // Update child's events in memory
            if (!activeChild.events) activeChild.events = [];
            activeChild.events.push({
                id: data.eventIds ? data.eventIds[0] : Date.now(),
                name: eventData.name,
                location: eventData.location,
                time: eventData.time
            });
            
            // Update the events display for the current child
            renderChildEvents(activeChild);
        } else {
            alert("❌ Failed to save event: " + (data.error || "Unknown error"));
            buttonElement.disabled = false;
            buttonElement.textContent = "Save";
        }
    } catch (error) {
        console.error("Error saving event:", error);
        alert("❌ Failed to save event. Please try again. Error: " + error.message);
        buttonElement.disabled = false;
        buttonElement.textContent = "Save";
    }
}

// Save all events to database
async function saveAllEventsToDatabase(events) {
    const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));
    
    if (!activeChild) {
        alert("❌ No active child selected");
        return;
    }
    
    if (!events || events.length === 0) {
        alert("❌ No events to save");
        return;
    }
    
    const confirmSave = confirm(`Save all ${events.length} event${events.length !== 1 ? 's' : ''} to ${activeChild.name}'s profile?`);
    if (!confirmSave) return;
    
    try {
        console.log("Original events to save:", events);
        
        // Format events to match database schema
        const formattedEvents = events.map(event => {
            console.log("Processing event:", event.title, "with date:", event.date);
            return {
                name: event.title || 'Untitled Event',
                location: event.address || event.venue || 'Location TBD',
                time: getEventDateString(event.date)  // Just store the string as-is
            };
        });
        
        console.log("Formatted events being saved:", formattedEvents);
        
        const response = await fetch('/dashboard/events/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                childId: activeChild.id, 
                events: formattedEvents
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Save all failed:", errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log("Save all response:", data);
        
        if (data.success) {
            alert(`Successfully saved ${data.count} event${data.count !== 1 ? 's' : ''} to ${activeChild.name}'s profile!`);
            
            closeEventFinderModal();
            
            // Refresh the page to show new events
            window.location.reload();
        } else {
            alert("❌ Failed to save events: " + (data.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Error saving events:", error);
        alert("❌ Failed to save events. Please try again. Error: " + error.message);
    }
}

// Toast notification
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("show");
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Render child's saved events
function renderChildEvents(child) {
    const eventListEl = document.getElementById("eventList");
    if (!eventListEl) return;
    
    eventListEl.innerHTML = "";
    
    if (child.events && child.events.length > 0) {
        child.events.forEach((ev) => {
            const li = document.createElement("li");

            // Google Calendar button with optional date parsing
            const a = document.createElement("a");
            let calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.name)}&location=${encodeURIComponent(ev.location)}`;
            
            // Try to parse the date for the calendar link
            const parsedDate = parseForCalendar(ev.time);
            if (parsedDate) {
                // Check if the original string contains time information
                const hasTime = /\d{1,2}:\d{2}|am|pm/i.test(ev.time || '');
                
                if (hasTime) {
                    // Has specific time - use the exact datetime
                    const formattedTime = parsedDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                    calendarUrl += `&dates=${formattedTime}/${formattedTime}`;
                } else {
                    // No specific time - create all-day event
                    // Format: YYYYMMDD (just the date, no time)
                    const year = parsedDate.getFullYear();
                    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(parsedDate.getDate()).padStart(2, '0');
                    const dateOnly = `${year}${month}${day}`;
                    
                    // For all-day events, end date is the next day
                    const nextDay = new Date(parsedDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const endYear = nextDay.getFullYear();
                    const endMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
                    const endDay = String(nextDay.getDate()).padStart(2, '0');
                    const endDateOnly = `${endYear}${endMonth}${endDay}`;
                    
                    calendarUrl += `&dates=${dateOnly}/${endDateOnly}`;
                }
            }
            
            a.href = calendarUrl;
            a.target = "_blank";
            a.rel = "noopener noreferrer";

            const btn = document.createElement("button");
            btn.className = "calendar-btn";
            btn.innerHTML = `<img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" width="18">`;
            a.appendChild(btn);

            li.appendChild(a);

            // Display the ORIGINAL date string (e.g., "Tomorrow 7:00 PM", "Sat, Mar 15")
            const dateSpan = document.createElement("span");
            dateSpan.className = "event-date";
            dateSpan.textContent = ev.time || "Date TBD";
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
        li.textContent = "No events saved yet. Search for events to add!";
        li.style.fontStyle = "italic";
        li.style.color = "#666";
        eventListEl.appendChild(li);
    }
}

// ------------------------------ EVENT FORM MODAL ------------------------ //

function showEventForm(event) {
    if(event) event.preventDefault();

    const modal = createEventFinderModal();
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeEventFinderModal() {
    const modal = document.querySelector('.event-finder-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function createEventFinderModal() {
	const modalOverlay = document.createElement('div');
	modalOverlay.className = 'event-finder-modal';

	const modalContent = document.createElement('div');
	modalContent.className = 'event-finder-modal-content';
    
    // Form container that includes both search and results
    const formContainer = document.createElement('div');
    formContainer.className = 'event-form-container';
    
    // Header with close button inside form container
    const header = document.createElement('div');
    header.className = 'modal-header';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'remove-item-event';
    closeBtn.innerHTML = '✖';
    closeBtn.onclick = closeEventFinderModal;

    // Build header
    header.appendChild(closeBtn);
    formContainer.appendChild(header);
    
    // Form
    const form = createEventForm();
    formContainer.appendChild(form);
    
    // Results container (directly below form, hidden initially)
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'event-search-results';
    resultsContainer.style.display = 'none';
    formContainer.appendChild(resultsContainer);
    
    // Add form container to modal
    modalContent.appendChild(formContainer);
    modalOverlay.appendChild(modalContent);
    
    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeEventFinderModal();
        }
    });
    
    return modalOverlay;
}

function sendCoords(coords){
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({role: "client-location", message: JSON.stringify(coords)}));
    }
}

function createEventForm() {
    const form = document.createElement('form');
    form.className = 'event-finder-form';

    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';

    const citySelect = document.createElement('select');
    citySelect.className = 'city-select';
    citySelect.innerHTML = '<option value="">-- Select a City --</option>';
    
    if (window.popularCities && Array.isArray(window.popularCities)) {
        window.popularCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }

    const locationInput = document.createElement('input');
    locationInput.type = 'text';
    locationInput.placeholder = 'Or enter custom location...';
    locationInput.className = 'location-input';

    citySelect.addEventListener('change', () => {
        if (citySelect.value) {
            locationInput.value = '';
            locationInput.disabled = true;
        } else {
            locationInput.disabled = false;
        }
    });

    locationInput.addEventListener('input', () => {
        if (locationInput.value.trim()) {
            citySelect.value = '';
        }
    });

    inputGroup.append(citySelect, locationInput);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'submit-btn';
    submitBtn.textContent = 'Search Events';

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        const location = citySelect.value || locationInput.value.trim();
        
        if (!location) {
            alert("Please select a city or enter a custom location");
            return;
        }
        
        const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));
        
        if (!activeChild) {
            alert("No active child selected. Please select a child first.");
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Searching...';
        submitBtn.classList.add('loading');
        
        try {
            await fetchEventsFromBackend(location, activeChild.id);
        } catch (error) {
            console.error("Error in form submission:", error);
            alert("An error occurred while searching for events");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Search Events';
            submitBtn.classList.remove('loading');
        }
    });

    form.append(inputGroup, submitBtn);
    return form;
}

// ------------------------------ CHAT FUNCTIONS ------------------------ //

function renderChatHistory(history) {
    const chatContainer = document.querySelector(".chat-container");
    if (!chatContainer) return;
    
    chatContainer.innerHTML = "";
    if (Array.isArray(history)) {
        history.forEach(msg => insertMessage(msg.role, msg.message));
    }
}

function insertMessage(role, message) {
    const parent = document.querySelector(".chat-container");
    if (!parent) return;

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

// ------------------------------ SOCKET FUNCTIONS ------------------------ //

function connectToServer() {
    console.log("Connecting to server......");

    // Instead of hardcoded localhost:
    // const ws = new WebSocket('ws://localhost:3000/dashboard/chat');

    // Use dynamic URL based on environment:
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // Gets current domain and port
    const socket = new WebSocket(`${protocol}//${host}/dashboard/chat`);


    socket.addEventListener("open", () => {
        console.log("Connected to server");
    });

    socket.addEventListener("events", (res) => {
        const data = res.filtered;
        console.log("Events received:", data);
    });

    socket.addEventListener("events-error", () => {
        console.log("Events error");
        renderNoEvents();
    });

    socket.addEventListener("message", (event) => {
        try {
            const data = JSON.parse(event.data);
            const { role, message } = data;

            insertMessage(role, message);

            const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));
            if (activeChild) {
                if (!activeChild.chatHistory) activeChild.chatHistory = [];

                if(role === "user-history")
                activeChild.chatHistory.push({ role, message });
            }

        } catch (error) {
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
        
        const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));

        const events = activeChild.events.map((ev) => ({
            name: ev.name || ev.title || "Untitled Event",
            location: ev.location || ev.address || "Location TBD",
            time: ev.time || ev.date || new Date().toISOString(),
            link: ev.link || null,
        }));

       

        socket.send(JSON.stringify({ role: "user", message: {message: prompt, name: activeChild.name, interests: activeChild.interests, events: JSON.stringify(events)}, chatId: currentChatId }));

        insertMessage("user", prompt);

        if (activeChild) {
            if (!activeChild.chatHistory) activeChild.chatHistory = [];
            activeChild.chatHistory.push({ role: "user", message: prompt });
        }

        input.value = '';
    } else {
        insertMessage("user", prompt);
        insertMessage("model", "Cannot answer prompt because no children exist to tie this conversation to.");
        input.value = "";
    }
};

function sendPrompt() {
    const input = document.querySelector("#name-input");
    const prompt = input.value.trim();

    if (prompt) {
        if (!socket || (socket.readyState !== WebSocket.OPEN)) {
            connectToServer();

            if (socket.readyState === WebSocket.CONNECTING) {
                socket.addEventListener('open', () => sendOnOpen(prompt), { once: true });
            } else if (socket.readyState === WebSocket.OPEN) {
                sendOnOpen(prompt);
            }
        } else {
            sendOnOpen(prompt);
        }
    }
}

// ------------------------------ INITIALIZATION ------------------------ //

document.addEventListener("DOMContentLoaded", () => {

    connectToServer();
    
    const form = document.querySelector("#chat-form");
    if (form) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            sendPrompt();
        });
    }

    const childButtons = document.querySelectorAll(".name-btn");
    const childNameEl = document.getElementById("childName");
    const childAgeEl = document.getElementById("childAge");
    const childInterestsEl = document.getElementById("childInterests");

    childrenData = window.childrenData || [];

    if (childrenData && childrenData.length > 0) {
        currentChatId = childrenData[0].chatId;
        renderChatHistory(childrenData[0]?.chatHistory);
        renderChildEvents(childrenData[0]);
    }

    childButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            childButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            const childId = btn.getAttribute("data-child-id");
            const child = childrenData.find(c => String(c.id) === String(childId));

            if (!child) return;

            currentChatId = btn.getAttribute("data-chat-id");

            if (childNameEl) childNameEl.textContent = child.name;

            if (childAgeEl) {
                childAgeEl.textContent = `${child.age} y/o`;
                childAgeEl.className = "age-tag";
                if (child.age < 13) childAgeEl.classList.add("age-child");
                else if (child.age < 20) childAgeEl.classList.add("age-teen");
            }

            if (childInterestsEl) {
                if (Array.isArray(child.interests) && child.interests.length > 0) {
                    childInterestsEl.innerHTML = "";
                    child.interests.forEach(interest => {
                        const span = document.createElement("span");
                        span.textContent = interest;
                        span.classList.add("interest-tag");
                        childInterestsEl.appendChild(span);
                    });
                } else {
                    childInterestsEl.textContent = "No interests listed.";
                }
            }

            renderChildEvents(child);
            renderChatHistory(child.chatHistory);


        });
    });
});
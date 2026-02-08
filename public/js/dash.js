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
            linkBtn.textContent = "ℹ️ More Info";
            detailsDiv.appendChild(linkBtn);
        }
        
        contentDiv.appendChild(detailsDiv);
        li.appendChild(contentDiv);
        
        // Save button for individual event
        const saveBtn = document.createElement("button");
        saveBtn.className = "save-event-btn";
        saveBtn.textContent = "💾 Save";
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
    saveAllBtn.textContent = "💾 Save All Events";
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

// Parse date string to ISO format
function parseEventDate(dateString) {
    if (!dateString || dateString === "Date TBD") {
        return new Date().toISOString();
    }
    
    try {
        // Try to parse the date
        const parsedDate = new Date(dateString);
        if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString();
        }
    } catch (e) {
        console.warn("Could not parse date:", dateString);
    }
    
    return new Date().toISOString();
}

// Save single event to database
async function saveSingleEvent(event, buttonElement) {
    const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));
    
    if (!activeChild) {
        alert("❌ No active child selected");
        return;
    }
    
    buttonElement.disabled = true;
    buttonElement.textContent = "⏳ Saving...";
    
    try {
        // Format the event data to match database schema
        const eventData = {
            name: event.title || 'Untitled Event',
            location: event.address || event.venue || 'Location TBD',
            time: parseEventDate(event.date)
        };
        
        console.log("Saving single event:", eventData);
        
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
            buttonElement.textContent = "✅ Saved";
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
            buttonElement.textContent = "💾 Save";
        }
    } catch (error) {
        console.error("Error saving event:", error);
        alert("❌ Failed to save event. Please try again. Error: " + error.message);
        buttonElement.disabled = false;
        buttonElement.textContent = "💾 Save";
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
        // Format events to match database schema
        const formattedEvents = events.map(event => ({
            name: event.title || 'Untitled Event',
            location: event.address || event.venue || 'Location TBD',
            time: parseEventDate(event.date)
        }));
        
        console.log("Saving all events:", formattedEvents);
        
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
            alert(`✅ Successfully saved ${data.count} event${data.count !== 1 ? 's' : ''} to ${activeChild.name}'s profile!`);
            
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

            // Google Calendar button
            const a = document.createElement("a");
            const eventTime = new Date(ev.time);
            const formattedTime = eventTime.toISOString().replace(/[-:]/g, '').split('.')[0];
            a.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.name)}&location=${encodeURIComponent(ev.location)}&dates=${formattedTime}/${formattedTime}`;
            a.target = "_blank";
            a.rel = "noopener noreferrer";

            const btn = document.createElement("button");
            btn.className = "calendar-btn";
            btn.innerHTML = `<img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" width="18">`;
            a.appendChild(btn);

            li.appendChild(a);

            const dateSpan = document.createElement("span");
            dateSpan.className = "event-date";
            dateSpan.textContent = eventTime.toLocaleDateString();
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
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn';
    closeBtn.innerHTML = '✖';
    closeBtn.onclick = closeEventFinderModal;
    modalContent.appendChild(closeBtn);
    
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = '<h2>🔍 Find Events</h2>';
    modalContent.appendChild(header);
    
    // Form container that includes both search and results
    const formContainer = document.createElement('div');
    formContainer.className = 'event-form-container';
    
    // Form
    const form = createEventForm();
    formContainer.appendChild(form);
    
    // Results container (directly below form, hidden initially)
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'event-search-results';
    resultsContainer.style.display = 'none';
    formContainer.appendChild(resultsContainer);
    
    modalContent.appendChild(formContainer);
    modalOverlay.appendChild(modalContent);
    
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
    submitBtn.textContent = '🔍 Search Events';

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        const location = citySelect.value || locationInput.value.trim();
        
        if (!location) {
            alert("⚠️ Please select a city or enter a custom location");
            return;
        }
        
        const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));
        
        if (!activeChild) {
            alert("⚠️ No active child selected. Please select a child first.");
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Searching...';
        submitBtn.classList.add('loading');
        
        try {
            await fetchEventsFromBackend(location, activeChild.id);
        } catch (error) {
            console.error("Error in form submission:", error);
            alert("❌ An error occurred while searching for events");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '🔍 Search Events';
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

    socket = new WebSocket("ws://localhost:3000/dashboard/chat");

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
        socket.send(JSON.stringify({ role: "user", message: prompt, chatId: currentChatId }));

        insertMessage("user", prompt);

        const activeChild = childrenData.find(c => String(c.chatId) === String(currentChatId));
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
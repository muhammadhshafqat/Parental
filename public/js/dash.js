document.addEventListener("DOMContentLoaded", () => {
  const childButtons = document.querySelectorAll(".name-btn");
  const childNameEl = document.getElementById("childName");
  const childAgeEl = document.getElementById("childAge");
  const childInterestsEl = document.getElementById("childInterests");
  const eventListEl = document.getElementById("eventList");

  // Children data injected from server into a global variable
  // In dashboard.ejs, add: <script>window.childrenData = <%- JSON.stringify(children) %></script>
  const childrenData = window.childrenData || [];

  childButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      childButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const childId = btn.getAttribute("data-child-id");
      const child = childrenData.find(c => String(c.id) === String(childId));

      if (!child) return;

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
          a.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.name)}&location=${encodeURIComponent(ev.location)}&dates=${new Date(ev.time).toISOString().replace(/[-:]/g,'').split('.')[0]}/${new Date(ev.time).toISOString().replace(/[-:]/g,'').split('.')[0]}`;
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
    });
  });
});

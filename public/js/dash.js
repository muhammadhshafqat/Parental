document.addEventListener("DOMContentLoaded", () => {
       
    console.log("h")
    const accountSection = document.createElement("div"); 
    accountSection.className = "account-section";
    
    accountSection.innerHTML = `
      <button class="account-btn" id="accountBtn" onclick="toggleDropdown(event)">
        <div class="account-photo">U</div>
        <span>Account</span>
        <div class="dropdown-arrow"></div>
      </button>
    
      <div class="dropdown-menu" id="dropdownMenu">
        <button class="dropdown-item" onclick="window.location.href='/account'">
          <span>👤</span> <span>Account Photo</span>
        </button>
        <button class="dropdown-item" onclick="window.location.href='/settings'">
          <span>⚙️</span> <span>Settings</span>
        </button>
        <button class="dropdown-item logout" onclick="logout()">
          <span>🚪</span> <span>Log Out</span>
        </button>
      </div>
    `;
      
    document.getElementsByTagName("header")[0].append(accountSection);

    document.addEventListener('click', function(event) {
        const accountSection = document.querySelector('.account-section');
        if (accountSection && !accountSection.contains(event.target)) {
          document.getElementById('dropdownMenu')?.classList.remove('active');
          document.getElementById('accountBtn')?.classList.remove('active');
        }
    });

    const btn = document.getElementById('accountBtn');
    if(btn) btn.classList.add('collapsed');
    
    

});

function toggleDropdown(e) {
  e.stopPropagation();
  const menu = document.getElementById('dropdownMenu');
  const btn = document.getElementById('accountBtn');
  menu.classList.toggle('active');
  btn.classList.toggle('active');
}



    function logout() {
      window.location.href = '/login';
    }
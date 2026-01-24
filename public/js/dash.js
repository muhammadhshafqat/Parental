import {getSupabase} from "./supabase-client";

const supabase = getSupabase();
export const user = supabase.auth.getUser();

if(user){

    

}

document.addEventListener("DOMContentLoaded", () => {
       
    document.addEventListener('click', function(event) {
        console.log('h');
        const accountSection = document.querySelector('.account-section');
        if (accountSection && !accountSection.contains(event.target)) {
          document.getElementById('dropdownMenu')?.classList.remove('active');
          document.getElementById('accountBtn')?.classList.remove('active');
        }
    });

    const btn = document.getElementById('accountBtn');
    if(btn) btn.classList.add('collapsed');
    
    

});


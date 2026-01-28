import {getSupabase} from "./supabase-client";

const supabase = getSupabase();

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



// event handler for syllabus button
async function selectSyllabus(){

    // if clicked then use the olevel and alevel syllabi to create a list of topic year by year to use for the parent

}
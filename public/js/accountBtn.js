function toggleDropdown(e)
{
    e.stopPropagation();
    const menu = document.getElementById('dropdownMenu');
    const btn = document.getElementById('accountBtn');
    menu.classList.toggle('active');
    btn.classList.toggle('active');
}
		
function closeMenu(){

    const menu = document.getElementById('dropdownMenu');
    const btn = document.getElementById('accountBtn');
    menu.classList.remove('active');
    btn.classList.remove('active');

}
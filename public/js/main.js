function validpass() {
    const password = document.getElementById('password');
    const cpassword = document.getElementById('cpassword');

    if (password !== cpassword){
        alert("Passwords do not match")
        return false;
    }
        return true;
}
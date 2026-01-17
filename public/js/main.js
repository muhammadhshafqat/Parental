function validpass() {
    const password = document.getElementById('password').value;
    const cpassword = document.getElementById('cpassword').value;

    if (password !== cpassword){
        alert("Passwords do not match")
        return false;
    }
        return true;
}
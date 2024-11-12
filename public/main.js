// Login function that submits the login form via fetch
async function handleLogin(event) {
    event.preventDefault(); // Prevent the default form submission

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);  // Show a success message
            if (data.redirect) {
                window.location.href = 'index.html';  // Redirect to homepage if login is successful
            }
        } else {
            alert(data.message);  // Show error message for invalid login
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during login');
    }
}

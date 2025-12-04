// Connect Socket.IO to your Render backend
const socket = io("https://chat-app-876w.onrender.com");

// Send message
function send() {
    const sender = document.getElementById("sender").value;
    const receiver = document.getElementById("receiver").value;
    const text = document.getElementById("msg").value;

    if (!sender || !receiver || !text) {
        alert("Please fill all fields");
        return;
    }

    const data = { sender, receiver, text };

    // Store in database + send WebSocket event
    fetch("https://chat-app-876w.onrender.com/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    document.getElementById("msg").value = "";
}

// Real-time new message comes here
socket.on("newMessage", (msg) => {
    addMessage(msg);
});

// Display message + auto remove in 30 seconds
function addMessage(msg) {
    const chatBox = document.getElementById("chat");

    const p = document.createElement("p");
    p.innerHTML = `<b>${msg.sender}:</b> ${msg.text}`;

    chatBox.appendChild(p);

    // ❗ Remove the message after 30 seconds
    setTimeout(() => {
        p.remove();
    }, 30000); // 30000ms = 30 seconds
}

// Load old messages on page load
window.onload = function () {
    fetch("https://chat-app-876w.onrender.com/messages")
        .then(res => res.json())
        .then(data => {
            data.forEach(m => addMessage(m));
        });
};

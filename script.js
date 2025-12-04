// ---------------------------
// Connect to Render backend
// ---------------------------
const backend = "https://chat-app-876w.onrender.com";
const socket = io(backend);

// ---------------------------
// Get sender & receiver from input fields
// (You can also use URL params if needed)
// ---------------------------
const senderInput = document.getElementById("sender");
const receiverInput = document.getElementById("receiver");
const msgInput = document.getElementById("msg");
const chatBox = document.getElementById("chat");

// ---------------------------
// Send message
// ---------------------------
function send() {
    const sender = senderInput.value.trim();
    const receiver = receiverInput.value.trim();
    const text = msgInput.value.trim();

    if (!sender || !receiver || !text) {
        alert("Please fill all fields");
        return;
    }

    const data = { sender, receiver, text };

    // Send to backend + WebSocket
    fetch(`${backend}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    msgInput.value = "";
}

// ---------------------------
// Typing Indicator
// ---------------------------
msgInput.addEventListener("input", () => {
    const sender = senderInput.value.trim();
    if (!sender) return;
    socket.emit("typing", { sender, receiver: receiverInput.value.trim() });
});

socket.on("typing", (data) => {
    if (data.sender !== senderInput.value.trim() &&
        data.receiver === senderInput.value.trim()) {
        showTyping(`${data.sender} is typing…`);
    }
});

function showTyping(text) {
    let typingDiv = document.getElementById("typing");
    if (!typingDiv) {
        typingDiv = document.createElement("div");
        typingDiv.id = "typing";
        typingDiv.style.fontStyle = "italic";
        typingDiv.style.color = "gray";
        chatBox.appendChild(typingDiv);
    }
    typingDiv.innerText = text;

    setTimeout(() => {
        if (typingDiv) typingDiv.remove();
    }, 1500);
}

// ---------------------------
// Display message + auto remove after 30s
// ---------------------------
function addMessage(msg) {
    const senderName = senderInput.value.trim();
    const receiverName = receiverInput.value.trim();

    // Show messages only for this chat pair
    if (!(
        (msg.sender === senderName && msg.receiver === receiverName) ||
        (msg.sender === receiverName && msg.receiver === senderName)
    )) return;

    const p = document.createElement("p");
    p.innerHTML = `<b>${msg.sender}:</b> ${msg.text}`;

    // WhatsApp style: sent on right, received on left
    p.style.textAlign = msg.sender === senderName ? "right" : "left";
    p.style.background = msg.sender === senderName ? "#dcf8c6" : "#fff";
    p.style.padding = "6px 10px";
    p.style.borderRadius = "8px";
    p.style.margin = "5px";
    p.style.display = "inline-block";

    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Remove from UI after 30 seconds
    setTimeout(() => p.remove(), 30000);
}

// ---------------------------
// Listen for new real-time messages
// ---------------------------
socket.on("newMessage", (msg) => addMessage(msg));

// ---------------------------
// Load old messages on page load
// ---------------------------
window.onload = function () {
    fetch(`${backend}/messages`)
        .then(res => res.json())
        .then(data => {
            data.forEach(m => addMessage(m));
        });
};

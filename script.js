const backend = "https://chat-app-876w.onrender.com";
const socket = io(backend);

// Inputs
const senderInput = document.getElementById("sender");
const receiverInput = document.getElementById("receiver");
const msgInput = document.getElementById("msg");
const chatBox = document.getElementById("messages");
;

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
// Display message
// ---------------------------
function addMessage(msg) {
    const senderName = senderInput.value.trim();
    const receiverName = receiverInput.value.trim();

    if (!(
        (msg.sender === senderName && msg.receiver === receiverName) ||
        (msg.sender === receiverName && msg.receiver === senderName)
    )) return;

    const p = document.createElement("p");
    p.id = msg._id; // IMPORTANT: set DOM id so it can be removed

    p.innerHTML = `<b>${msg.sender}:</b> ${msg.text}`;
    p.style.textAlign = msg.sender === senderName ? "right" : "left";
    p.style.background = msg.sender === senderName ? "#dcf8c6" : "#fff";
    p.style.padding = "6px 10px";
    p.style.borderRadius = "8px";
    p.style.margin = "5px";
    p.style.display = "inline-block";

    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ---------------------------
// Listen for new real-time messages
// ---------------------------
socket.on("newMessage", (msg) => addMessage(msg));

// ---------------------------
// Listen for deleted messages
// ---------------------------
socket.on("deleteMessage", (id) => {
    const msgElement = document.getElementById(id);
    if (msgElement) msgElement.remove();
});

// ---------------------------
// Load old messages
// ---------------------------
window.onload = function () {
    fetch(`${backend}/messages`)
        .then(res => res.json())
        .then(data => data.forEach(m => addMessage(m)));
};

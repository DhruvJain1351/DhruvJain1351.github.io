window.addEventListener("beforeunload", function (event) {
  const message = "Are you sure you want to leave? Any unsaved data will be lost.";
  // For most modern browsers, setting event.returnValue will show a confirmation dialog
  event.returnValue = message;  // Standard for most browsers
  // Some older browsers (or non-standard behavior) still require the return statement
  return message; // For some older browsers (it might not show in most cases)
});

if (Notification.permission === "default") {
  Notification.requestPermission();
}

const myUsername = prompt("Please enter your name") || "Anonymous";
const url = new URL(`./start_web_socket?username=${myUsername}`, location.href);
url.protocol = url.protocol.replace("http", "ws");
const socket = new WebSocket(url);

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.event) {
    case "update-users":
      updateUserList(data.usernames);
      break;

    case "send-message":
      addMessage(data.username, data.message, data.image);
      showNotification(data.username, data.message);
      break;
  }
};

function updateUserList(usernames) {
  const userList = document.getElementById("users");
  userList.replaceChildren();

  for (const username of usernames) {
    const listItem = document.createElement("li");
    listItem.textContent = username;
    userList.appendChild(listItem);
  }
}

function addMessage(username, message, image = null) {
  const template = document.getElementById("message");
  const clone = template.content.cloneNode(true);

  clone.querySelector("span").textContent = username;
  clone.querySelector("p").textContent = message;

  if (image) {
    const imgElement = clone.querySelector("img");
    imgElement.src = image;
    imgElement.style.display = "block";
  }

  document.getElementById("conversation").prepend(clone);
}

function showNotification(username, message) {
  if (document.hidden && Notification.permission === "granted") {
    new Notification(`${username} sent a message`, {
      body: message
    });
  }
}

const inputElement = document.getElementById("data");
const imageInput = document.getElementById("imageInput");
inputElement.focus();

const form = document.getElementById("form");

form.onsubmit = (e) => {
  e.preventDefault();

  const text = inputElement.value.trim();
  const file = imageInput.files[0];

  if (!text && !file) return;
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      socket.send(
        JSON.stringify({
          event: "send-message",
          message: text,
          image: event.target.result, // Base64 image data
          timestamp: Date.now(),
        })
      );
    };
    reader.readAsDataURL(file);
  } else {
    const message = inputElement.value;
    socket.send(JSON.stringify({ event: "send-message", message: text, timestamp: Date.now() }));
    inputElement.value = "";
  }
};

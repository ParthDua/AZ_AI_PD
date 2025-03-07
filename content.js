// content.js
// Author:
// Author URI: https://
// Author Github URI: https://www.github.com/
// Project Repository URI: https://github.com/
// Description: Handles all the webpage level activities (e.g. manipulating page data, etc.)
// License: MIT

const bookmarkImgURL = chrome.runtime.getURL("assets/help2.png");

// Function to add the chat button
function addChatButton() {
    const chatButton = document.createElement("img");
    chatButton.id = "add-chat-button";
    chatButton.src = bookmarkImgURL;
    chatButton.style.width = "25px";
    chatButton.style.height = "25px";
    chatButton.style.cursor = "pointer";
    chatButton.style.position = "relative";
    chatButton.style.top = "2px";

    const askDoubtButton = document.getElementsByClassName("coding_ask_doubt_button__FjwXJ")[0];
    if (askDoubtButton) {
        askDoubtButton.parentNode.style.display = "flex";
        askDoubtButton.parentNode.style.alignItems = "center";
        askDoubtButton.parentNode.insertBefore(chatButton, askDoubtButton);
    }

    chatButton.addEventListener("click", toggleChatbox);
}


// Chat Box
const chatbox = document.createElement("div");
chatbox.style.position = "fixed";
chatbox.style.bottom = "80px";
chatbox.style.right = "20px";
chatbox.style.width = "300px";
chatbox.style.height = "400px";
chatbox.style.backgroundColor = "#f8f9fa";
chatbox.style.border = "1px solid #ccc";
chatbox.style.borderRadius = "10px";
chatbox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
chatbox.style.display = "none";
chatbox.style.flexDirection = "column";
chatbox.style.overflow = "hidden";
chatbox.style.zIndex = "1000";
document.body.appendChild(chatbox);

// Chat header
const chatHeader = document.createElement("div");
chatHeader.innerText = "AI Chat - Doubt Solver";
chatHeader.style.backgroundColor = "#007bff";
chatHeader.style.color = "white";
chatHeader.style.padding = "10px";
chatHeader.style.textAlign = "center";
chatHeader.style.fontWeight = "bold";
chatHeader.style.cursor = "pointer";
chatbox.appendChild(chatHeader);

// Chat messages area
const chatMessages = document.createElement("div");
chatMessages.style.flex = "1";
chatMessages.style.padding = "10px";
chatMessages.style.overflowY = "auto";
chatMessages.style.maxHeight = "300px";
chatMessages.style.display = "flex";
chatMessages.style.flexDirection = "column";
chatbox.appendChild(chatMessages);

// Input box
const chatInput = document.createElement("input");
chatInput.type = "text";
chatInput.placeholder = "Ask something about this problem...";
chatInput.style.width = "calc(100% - 20px)";
chatInput.style.padding = "10px";
chatInput.style.margin = "10px";
chatInput.style.border = "1px solid #ccc";
chatInput.style.borderRadius = "5px";
chatbox.appendChild(chatInput);

// Problem context extraction
let problemContext = "Loading problem context..."; // Define globally

setTimeout(() => {
    const ProblemName = document.querySelector(".fw-bolder.problem_heading.fs-4")?.innerText || "Unknown Problem";
    const ProblemDescription = document.querySelector(".coding_desc__pltWY.problem_paragraph")?.innerText || "";
    const ProblemInput = document.querySelectorAll(".coding_input_format__pv9fS.problem_paragraph")[0]?.innerText || "";
    const ProblemOutput = document.querySelectorAll(".coding_input_format__pv9fS.problem_paragraph")[1]?.innerText || "";
    const ProblemConstraints = document.querySelectorAll(".coding_input_format__pv9fS.problem_paragraph")[2]?.innerText || "";
    const ProblemLanguage = document.querySelector(".d-flex.align-items-center.gap-1.text-blue-dark")?.innerText || "";

    console.log("Extracted Problem Context:", { ProblemName, ProblemDescription, ProblemInput, ProblemOutput, ProblemConstraints, ProblemLanguage });

    const problemContext = `Problem Name: ${ProblemName}
    Description: ${ProblemDescription}
    Input: ${ProblemInput}
    Output: ${ProblemOutput}
    Constraints: ${ProblemConstraints}
    Language: ${ProblemLanguage}`;

}, 2000); // Delay to ensure DOM is loaded

// Store chat history
let chatHistory = [];

// Function to add messages to chat
function addMessage(text, isUser) {
    const message = document.createElement("div");
    message.innerText = text;
    message.style.padding = "8px";
    message.style.margin = "5px";
    message.style.borderRadius = "5px";
    message.style.maxWidth = "80%";
    message.style.wordWrap = "break-word";

    if (isUser) {
        message.style.backgroundColor = "#007bff";
        message.style.color = "white";
        message.style.alignSelf = "flex-end";
    } else {
        message.style.backgroundColor = "#e9ecef";
        message.style.alignSelf = "flex-start";
    }

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    
    chatHistory.push({ text, isUser });
}

// Introduce AI when chatbox is opened
function introduceAI() {
    addMessage("Hello! I'm your AI doubt solver. How can I help you with this problem?", false);
}

// Toggle chatbox visibility
function toggleChatbox() {
    if (chatbox.style.display === "none") {
        chatbox.style.display = "flex";
        if (chatMessages.childNodes.length === 0) {
            introduceAI();
        }
    } else {
        chatbox.style.display = "none";
    }
}

// Function to send message to Gemini API
async function sendMessageToGemini(message) {
    const userMessage = `You are an AI chatbot specifically designed to assist users with the current coding problem. 
    Only answer questions related to this problem and provide hints before giving full code. 
    Do not discuss other topics. Provide hints and encourage users to think before giving complete solutions.
    
    User Query: ${message}
    Chat History: ${JSON.stringify(chatHistory)}
    Problem Context: ${problemContext}`;

    return new Promise((resolve) => {
        chrome.storage.sync.get("geminiApiKey", async function(data) {
            const apiKey = data.geminiApiKey;
            if (!apiKey) {
                alert("Please set your Gemini API Key in the extension popup.");
                resolve("Error: API Key not set.");
                return;
            }

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: userMessage }] }]
                    })
                });

                const data = await response.json();
                if (data?.candidates?.length > 0) {
                    resolve(data.candidates[0].content.parts[0].text);
                } else {
                    resolve("Sorry, I couldn't process that.");
                }

            } catch (error) {
                console.error("Error:", error);
                resolve("Error connecting to AI.");
            }
        });
    });
}

// Handle user input
chatInput.addEventListener("keypress", async (event) => {
    if (event.key === "Enter" && chatInput.value.trim() !== "") {
        const userText = chatInput.value.trim();
        addMessage(userText, true);
        chatInput.value = "";

        const aiResponse = await sendMessageToGemini(userText);
        addMessage(aiResponse, false);
    }
});

// Ensure chat button is added on load


window.addEventListener("load", addChatButton);



/*
// Create the chatbox container (hidden by default)
const chatbox = document.createElement("div");
chatbox.style.position = "fixed";
chatbox.style.bottom = "80px";
chatbox.style.right = "20px";
chatbox.style.width = "300px";
chatbox.style.height = "400px";
chatbox.style.backgroundColor = "#f8f9fa";
chatbox.style.border = "1px solid #ccc";
chatbox.style.borderRadius = "10px";
chatbox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
chatbox.style.display = "none";
chatbox.style.flexDirection = "column";
chatbox.style.overflow = "hidden";
chatbox.style.zIndex = "1000";
document.body.appendChild(chatbox);

// Chat header
const chatHeader = document.createElement("div");
chatHeader.innerText = "AI Chat";
chatHeader.style.backgroundColor = "#007bff";
chatHeader.style.color = "white";
chatHeader.style.padding = "10px";
chatHeader.style.textAlign = "center";
chatHeader.style.fontWeight = "bold";
chatHeader.style.cursor = "pointer";
chatbox.appendChild(chatHeader);

// Chat messages area
const chatMessages = document.createElement("div");
chatMessages.style.flex = "1";
chatMessages.style.padding = "10px";
chatMessages.style.overflowY = "auto";
chatMessages.style.maxHeight = "300px";
chatMessages.style.display = "flex";
chatMessages.style.flexDirection = "column";
chatbox.appendChild(chatMessages);

// Input box
const chatInput = document.createElement("input");
chatInput.type = "text";
chatInput.placeholder = "Ask something...";
chatInput.style.width = "calc(100% - 20px)";
chatInput.style.padding = "10px";
chatInput.style.margin = "10px";
chatInput.style.border = "1px solid #ccc";
chatInput.style.borderRadius = "5px";
chatbox.appendChild(chatInput);

// Toggle chatbox visibility
function toggleChatbox() {
    chatbox.style.display = chatbox.style.display === "none" ? "flex" : "none";
}

// Function to add messages to chat
function addMessage(text, isUser) {
    const message = document.createElement("div");
    message.innerText = text;
    message.style.padding = "8px";
    message.style.margin = "5px";
    message.style.borderRadius = "5px";
    message.style.maxWidth = "80%";
    message.style.wordWrap = "break-word";

    if (isUser) {
        message.style.backgroundColor = "#007bff";
        message.style.color = "white";
        message.style.alignSelf = "flex-end";
    } else {
        message.style.backgroundColor = "#e9ecef";
        message.style.alignSelf = "flex-start";
    }

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
}

// Function to send message to Gemini API
async function sendMessageToGemini(message) {
    chrome.storage.sync.get("geminiApiKey", async function(data) {
        const apiKey = data.geminiApiKey;
        if (!apiKey) {
            alert("Please set your Gemini API Key in the extension popup.");
            return;
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: message }] }]
                })
            });

            const data = await response.json();
            if (data && data.candidates && data.candidates.length > 0) {
                addMessage(data.candidates[0].content.parts[0].text, false);
            } else {
                addMessage("Sorry, I couldn't process that.", false);
            }
        } catch (error) {
            console.error("Error:", error);
            addMessage("Error connecting to AI.", false);
        }
    });
}

// Handle user input
chatInput.addEventListener("keypress", async (event) => {
    if (event.key === "Enter" && chatInput.value.trim() !== "") {
        const userText = chatInput.value.trim();
        addMessage(userText, true);
        chatInput.value = "";
        sendMessageToGemini(userText);
    }
});

window.addEventListener("load", addChatButton);
*/

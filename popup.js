// Handles your frontend UI logic.
document.getElementById("saveKeyBtn").addEventListener("click", function() {
    const apiKey = document.getElementById("apiKeyInput").value;
    
    if (apiKey.trim() !== "") {
        chrome.storage.sync.set({ geminiApiKey: apiKey }, function() {
            alert("API Key saved successfully!");
        });
    } else {
        alert("Please enter a valid API Key.");
    }
});

import App from "./App.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("Loading visualizer...");

  try {
    // Get the data from the embedded JSON
    const graphData = JSON.parse(
      document.getElementById("graph-data").textContent,
    );
    // Create and store app instance globally
    const app = new App(graphData);
    window.appInstance = app;

    setupClearSelectionButton();
  } catch (error) {
    console.error("Failed to initialize:", error);
  }
});

function setupClearSelectionButton() {
  const clearButton = document.getElementById("btn-clear-selection");

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      console.log("Clear button clicked");
      if (window.appInstance && window.appInstance.selectionManager) {
        window.appInstance.selectionManager.clearSelection();
      } else {
        console.warn("Selection manager not found");
      }
    });
  } else {
    console.warn("Clear selection button not found");
  }
}

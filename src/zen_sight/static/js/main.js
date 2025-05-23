import App from "./App.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing app...");

  try {
    // Get the data from the embedded JSON
    const graphData = JSON.parse(
      document.getElementById("graph-data").textContent,
    );

    // Create app instance
    const app = new App(graphData);

    // button listeners
    setupButtons(app);
  } catch (error) {
    console.error("Failed to initialize:", error);
  }
});

function setupButtons(app) {
  console.log("Setting up button handlers");

  // Clear selection button
  const clearBtn = document.getElementById("btn-clear-selection");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      console.log("Clear selection button clicked");
      app.clearSelection();
    });
  } else {
    console.warn("Clear selection button not found");
  }

  // Remove node button
  const removeNodeBtn = document.getElementById("btn-remove-node");
  if (removeNodeBtn) {
    removeNodeBtn.addEventListener("click", function () {
      console.log("Remove node button clicked");
      app.removeSelectedNodes();
    });
  } else {
    console.warn("Remove node button not found");
  }

  // Remove edge button
  const removeEdgeBtn = document.getElementById("btn-remove-edge");
  if (removeEdgeBtn) {
    removeEdgeBtn.addEventListener("click", function () {
      console.log("Remove edge button clicked");
      app.removeEdgesBetweenSelectedNodes();
    });
  } else {
    console.warn("Remove edge button not found");
  }
}

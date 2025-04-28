import App from "./App.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("Loading visualizer...");

  try {
    // Get the data from the embedded JSON
    const graphData = JSON.parse(
      document.getElementById("graph-data").textContent,
    );

    const app = new App(graphData);
  } catch (error) {
    console.error("Failed to initialize:", error);
  }
});

import DataProcessor from "./services/DataProcessor.js";
import Graph from "./components/complex/Graph.js";
import Faces from "./components/complex/Faces.js";
import Tetrahedra from "./components/complex/Tetrahedra.js";
import SelectionManager from "./components/SelectionManager.js";
import EditService from "./services/EditService.js";

class App {
  constructor(data) {
    console.log("Initializing app...");
    this.container = document.getElementById("graph-container");

    // Initialize
    this.selectionManager = new SelectionManager();

    // Make accessible globally
    window.appInstance = this;

    this.init(data);
    this.animate();

    console.log("App initialization complete");
  }

  init(data) {
    try {
      // Create graph
      this.graphComponent = new Graph(this.container);
      this.graphComponent.initialize();

      // Connect components
      this.selectionManager.setGraph(this.graphComponent);
      this.graphComponent.setSelectionManager(this.selectionManager);

      // Initialize edit service
      this.editService = new EditService(
        this.graphComponent,
        this.selectionManager,
      );

      this.selectionManager.onSelectionChange = (selectedNodes) => {
        console.log("Selection changed:", selectedNodes);
        this.updateButtonStates(selectedNodes);
      };

      const processedData = DataProcessor.processGraphData(data);

      // Set the nodes and links to the graph
      this.graphComponent.setData({
        nodes: processedData.nodes,
        links: processedData.links,
      });

      // Create and initialize face renderer if faces exist
      if (processedData.faces && processedData.faces.length > 0) {
        this.facesComponent = new Faces(this.graphComponent);
        this.facesComponent.setData(processedData);
        console.log("Faces initialized");
      }

      if (processedData.tetrahedra && processedData.tetrahedra.length > 0) {
        this.tetrahedraComponent = new Tetrahedra(this.graphComponent);
        this.tetrahedraComponent.setData(processedData);
        console.log("Tetrahedra initialized");
      }
    } catch (error) {
      console.error("Error initializing graph:", error);
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    // Update the faces and tetrahedra components
    if (this.facesComponent) {
      this.facesComponent.update();
    }
    if (this.tetrahedraComponent) {
      this.tetrahedraComponent.update();
    }
  }

  // Selection methods
  clearSelection() {
    console.log("App: Clearing selection");
    if (this.selectionManager) {
      this.selectionManager.clearSelection();
    }
  }

  // Update button states based on selection
  updateButtonStates(selectedNodes) {
    const removeNodeBtn = document.getElementById("btn-remove-node");
    const removeEdgeBtn = document.getElementById("btn-remove-edge");

    if (removeNodeBtn) {
      removeNodeBtn.disabled = selectedNodes.length === 0;
    }

    if (removeEdgeBtn) {
      removeEdgeBtn.disabled = selectedNodes.length < 2;
    }
  }

  // Edit methods
  async removeSelectedNodes() {
    console.log("App: Removing selected nodes");
    if (!this.editService) {
      console.error("EditService not initialized");
      return;
    }

    try {
      const updatedData = await this.editService.removeSelectedNodes();
      if (updatedData) {
        console.log(
          "Updating graph with new data after node removal:",
          updatedData,
        );
        this.updateGraph(updatedData);
      }
    } catch (error) {
      console.error("Error removing nodes:", error);
    }
  }

  async removeEdgesBetweenSelectedNodes() {
    console.log("App: Removing edges between selected nodes");
    if (!this.editService) {
      console.error("EditService not initialized");
      return;
    }

    try {
      const updatedData =
        await this.editService.removeEdgesBetweenSelectedNodes();
      if (updatedData) {
        console.log("Updating graph with new data after edge removal");
        this.updateGraph(updatedData);
      }
    } catch (error) {
      console.error("Error removing edges:", error);
    }
  }

  updateGraph(graphData) {
    if (!graphData || !this.graphComponent) {
      console.error("Missing data or graph component for update");
      return;
    }

    console.log("Updating graph with:", graphData);
    this.graphComponent.setData(graphData);

    // updating faces and tetrahedra, use DataProcessor first
    if (
      (graphData.faces && graphData.faces.length > 0) ||
      (graphData.tetrahedra && graphData.tetrahedra.length > 0)
    ) {
      const processedData = DataProcessor.processGraphData(graphData);

      // faces
      if (processedData.faces && processedData.faces.length > 0) {
        if (this.facesComponent) {
          this.facesComponent.setData(processedData);
        } else {
          this.facesComponent = new Faces(this.graphComponent);
          this.facesComponent.setData(processedData);
        }
      }

      // tetrahedra
      if (processedData.tetrahedra && processedData.tetrahedra.length > 0) {
        if (this.tetrahedraComponent) {
          this.tetrahedraComponent.setData(processedData);
        } else {
          this.tetrahedraComponent = new Tetrahedra(this.graphComponent);
          this.tetrahedraComponent.setData(processedData);
        }
      }
    }
  }
}

window.App = App;
export default App;

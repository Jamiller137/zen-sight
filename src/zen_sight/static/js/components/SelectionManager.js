class SelectionManager {
  constructor() {
    this.selectedNodes = new Set();
    this.onSelectionChange = null;
    this.graph = null;
    console.log("SelectionManager initialized");
  }

  setGraph(graph) {
    this.graph = graph;
    console.log("Graph set in SelectionManager");
  }

  toggleSelection(nodeID) {
    console.log("Toggling selection for node:", nodeID);

    if (this.selectedNodes.has(nodeID)) {
      this.selectedNodes.delete(nodeID);
    } else {
      this.selectedNodes.add(nodeID);
    }

    // Trigger visualization update
    if (this.graph && this.graph.refresh) {
      this.graph.refresh();
    }

    if (this.onSelectionChange) {
      this.onSelectionChange(Array.from(this.selectedNodes));
    }
  }

  clearSelection() {
    console.log("Clearing selection");
    this.selectedNodes.clear();

    // Trigger visualization update
    if (this.graph && this.graph.refresh) {
      this.graph.refresh();
    }

    if (this.onSelectionChange) {
      this.onSelectionChange([]);
    }
  }

  isSelected(nodeID) {
    return this.selectedNodes.has(nodeID);
  }

  getSelectedNodes() {
    return Array.from(this.selectedNodes);
  }
}

export default SelectionManager;

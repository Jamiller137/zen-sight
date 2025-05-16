class SelectionManager {
  constructor() {
    this.selectedNodes = new Set();
    this.onSelectionChange = null;
    this.graph = null;
  }

  setGraph(graph) {
    this.graph = graph;
    // Connect the graph to selection manager
    if (this.graph) {
      this.graph.setSelectionManager(this);
    }
  }

  toggleSelection(nodeID) {
    if (this.selectedNodes.has(nodeID)) {
      this.selectedNodes.delete(nodeID);
    } else {
      this.selectedNodes.add(nodeID);
    }
    this.refreshGraph();
    if (this.onSelectionChange) {
      this.onSelectionChange(Array.from(this.selectedNodes));
    }
  }

  clearSelection() {
    this.selectedNodes.clear();
    this.refreshGraph();
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
  refreshGraph() {
    if (this.graph) {
      this.graph.refresh();
    }
  }
}

export default SelectionManager;

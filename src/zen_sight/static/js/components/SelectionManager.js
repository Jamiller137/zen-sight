class SelectionManager {
  constructor() {
    this.selectedNodes = new Set();
    this.onSelectionChange = null;
  }

  toggleSelection(nodeID) {
    if (this.selectedNodes.has(nodeID)) {
      this.selectedNodes.delete(nodeID);
    } else {
      this.selectedNodes.add(nodeID);
    }
    if (this.onSelectionChange) {
      this.onSelectionChange(Array.from(this.selectedNodes));
    }
  }

  clearSelection() {
    this.selectedNodes.clear();
    if (this.onSelectionChange) {
      this.onSelectionChange([]);
    }
  }

  getSelectedNodes() {
    return Array.from(this.selectedNodes);
  }
}

export default SelectionManager;

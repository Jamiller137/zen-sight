class EditService {
  constructor(graph, selectionManager) {
    this.graph = graph;
    this.selectionManager = selectionManager;
    console.log("EditService initialized with local operations only");
  }

  async removeSelectedNodes() {
    const selectedNodes = this.selectionManager.getSelectedNodes();
    console.log("EditService: Removing nodes locally:", selectedNodes);

    if (selectedNodes.length === 0) {
      console.warn("No nodes selected for removal");
      return null;
    }

    return this.localRemoveNodes(selectedNodes);
  }

  async removeEdgesBetweenSelectedNodes() {
    const selectedNodes = this.selectionManager.getSelectedNodes();
    console.log(
      "EditService: Removing edges locally between nodes:",
      selectedNodes,
    );

    if (selectedNodes.length < 2) {
      console.warn("Need at least 2 nodes selected to remove edges");
      return null;
    }

    return this.localRemoveEdges(selectedNodes);
  }

  localRemoveNodes(nodeIds) {
    if (!this.graph || !this.graph.getGraphData) {
      console.error("Graph or getGraphData method not available");
      return null;
    }

    const graphData = this.graph.getGraphData();
    if (!graphData) {
      console.error("Could not retrieve graph data");
      return null;
    }

    console.log(
      "Current nodes:",
      graphData.nodes.map((n) => n.id),
    );
    console.log("Nodes to remove:", nodeIds);

    const nodeIdSet = new Set(nodeIds);

    const newNodes = graphData.nodes.filter((node) => {
      return !nodeIdSet.has(node.id);
    });

    console.log(
      "Remaining nodes:",
      newNodes.map((n) => n.id),
    );

    const newLinks = graphData.links.filter((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      return !nodeIdSet.has(sourceId) && !nodeIdSet.has(targetId);
    });

    this.selectionManager.clearSelection();

    console.log(
      `Updated graph: ${newNodes.length} nodes, ${newLinks.length} links`,
    );

    return {
      nodes: newNodes,
      links: newLinks,
    };
  }

  localRemoveEdges(nodeIds) {
    if (!this.graph || !this.graph.getGraphData) {
      console.error("Graph or getGraphData method not available");
      return null;
    }

    const graphData = this.graph.getGraphData();
    if (!graphData) {
      console.error("Could not retrieve graph data");
      return null;
    }

    console.log("Removing edges between nodes:", nodeIds);

    const selectedNodeSet = new Set(nodeIds);

    const newLinks = graphData.links.filter((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      // Only remove links where BOTH nodes are in the selection
      return !(selectedNodeSet.has(sourceId) && selectedNodeSet.has(targetId));
    });

    console.log(
      `Removed ${graphData.links.length - newLinks.length} edges between selected nodes`,
    );

    this.selectionManager.clearSelection();

    return {
      nodes: graphData.nodes,
      links: newLinks,
    };
  }
}

export default EditService;

import { useCallback } from "react";

export const useGraphOperations = (
  graphData,
  setGraphData,
  selectedNodes,
  setSelectedNodes,
  setSelectedFaces,
  setAffectedNodes,
  setCutOperations,
  setSplitOperations,
  saveOperation,
) => {
  const cutSelectedNodes = useCallback(async () => {
    if (selectedNodes.size === 0) return;

    const selectedNodeIds = Array.from(selectedNodes);
    const newAffectedNodes = new Set();

    // Find nodes affected by the cut
    graphData.links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      if (selectedNodes.has(sourceId) && !selectedNodes.has(targetId)) {
        newAffectedNodes.add(targetId);
      }
      if (selectedNodes.has(targetId) && !selectedNodes.has(sourceId)) {
        newAffectedNodes.add(sourceId);
      }
    });

    // Find faces affected by the cut
    graphData.faces?.forEach((face) => {
      const hasSelectedNode = face.nodes.some((nodeId) =>
        selectedNodes.has(nodeId),
      );
      if (hasSelectedNode) {
        face.nodes.forEach((nodeId) => {
          if (!selectedNodes.has(nodeId)) {
            newAffectedNodes.add(nodeId);
          }
        });
      }
    });

    const cutOperation = {
      id: Date.now(),
      color: "#ff6969", // This should come from props
      affectedNodes: new Set(newAffectedNodes),
      timestamp: new Date().toLocaleTimeString(),
    };

    setCutOperations((prev) => [...prev, cutOperation]);

    // Remove selected nodes and their connections
    const newNodes = graphData.nodes.filter(
      (node) => !selectedNodes.has(node.id),
    );
    const newLinks = graphData.links.filter((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;
      return !selectedNodes.has(sourceId) && !selectedNodes.has(targetId);
    });
    const newFaces =
      graphData.faces?.filter(
        (face) => !face.nodes.some((nodeId) => selectedNodes.has(nodeId)),
      ) || [];

    setGraphData({
      nodes: newNodes,
      links: newLinks,
      faces: newFaces,
    });

    setAffectedNodes((prev) => {
      const updated = new Set(prev);
      newAffectedNodes.forEach((nodeId) => updated.add(nodeId));
      return updated;
    });

    setSelectedNodes(new Set());
    setSelectedFaces(new Set());

    // Save operation
    setTimeout(
      () =>
        saveOperation("cut_nodes", `Cut ${selectedNodeIds.length} nodes`, {
          nodeIds: selectedNodeIds,
          cutColor: "#ff6969",
          affectedNodeIds: Array.from(newAffectedNodes),
        }),
      500,
    );
  }, [
    selectedNodes,
    graphData,
    setCutOperations,
    setGraphData,
    setAffectedNodes,
    setSelectedNodes,
    setSelectedFaces,
    saveOperation,
  ]);

  const splitSelectedNodes = useCallback(async () => {
    if (selectedNodes.size === 0) return;

    const selectedNodeIds = Array.from(selectedNodes);
    const duplicatedNodeIds = [];
    const nodeIdMapping = new Map();

    // Create duplicated nodes
    const newNodes = [...graphData.nodes];
    selectedNodeIds.forEach((originalId) => {
      const originalNode = graphData.nodes.find(
        (node) => node.id === originalId,
      );
      if (originalNode) {
        const duplicatedId = `${originalId}_split_${Date.now()}`;
        const duplicatedNode = {
          ...originalNode,
          id: duplicatedId,
          x: (originalNode.x || 0) + (Math.random() - 0.5) * 20,
          y: (originalNode.y || 0) + (Math.random() - 0.5) * 20,
          z: (originalNode.z || 0) + (Math.random() - 0.5) * 20,
        };

        newNodes.push(duplicatedNode);
        duplicatedNodeIds.push(duplicatedId);
        nodeIdMapping.set(originalId, duplicatedId);
      }
    });

    // Create new links for duplicated nodes
    const newLinks = [...graphData.links];
    graphData.links.forEach((link) => {
      const sourceId =
        typeof link.source === "object" ? link.source.id : link.source;
      const targetId =
        typeof link.target === "object" ? link.target.id : link.target;

      if (selectedNodes.has(sourceId) && !selectedNodes.has(targetId)) {
        newLinks.push({
          ...link,
          source: nodeIdMapping.get(sourceId),
          target: targetId,
        });
      } else if (!selectedNodes.has(sourceId) && selectedNodes.has(targetId)) {
        newLinks.push({
          ...link,
          source: sourceId,
          target: nodeIdMapping.get(targetId),
        });
      } else if (selectedNodes.has(sourceId) && selectedNodes.has(targetId)) {
        newLinks.push({
          ...link,
          source: nodeIdMapping.get(sourceId),
          target: nodeIdMapping.get(targetId),
        });
      }
    });

    // Create new faces for duplicated nodes
    const newFaces = [...(graphData.faces || [])];
    graphData.faces?.forEach((face) => {
      const hasSelectedNode = face.nodes.some((nodeId) =>
        selectedNodes.has(nodeId),
      );

      if (hasSelectedNode) {
        const newFaceNodes = face.nodes.map((nodeId) =>
          selectedNodes.has(nodeId) ? nodeIdMapping.get(nodeId) : nodeId,
        );

        newFaces.push({
          ...face,
          id: `${face.id}_split_${Date.now()}`,
          nodes: newFaceNodes,
        });
      }
    });

    const splitOperation = {
      id: Date.now(),
      color: "#69ff69",
      originalNodes: new Set(selectedNodeIds),
      duplicatedNodes: new Set(duplicatedNodeIds),
      timestamp: new Date().toLocaleTimeString(),
    };

    setSplitOperations((prev) => [...prev, splitOperation]);

    setGraphData({
      nodes: newNodes,
      links: newLinks,
      faces: newFaces,
    });

    setAffectedNodes((prev) => {
      const updated = new Set(prev);
      selectedNodeIds.forEach((nodeId) => updated.add(nodeId));
      duplicatedNodeIds.forEach((nodeId) => updated.add(nodeId));
      return updated;
    });

    setSelectedNodes(new Set());
    setSelectedFaces(new Set());

    setTimeout(
      () =>
        saveOperation("split_nodes", `Split ${selectedNodeIds.length} nodes`, {
          originalNodeIds: selectedNodeIds,
          duplicatedNodeIds: duplicatedNodeIds,
          splitColor: "#69ff69",
          affectedNodeIds: [...selectedNodeIds, ...duplicatedNodeIds],
        }),
      500,
    );
  }, [
    selectedNodes,
    graphData,
    setSplitOperations,
    setGraphData,
    setAffectedNodes,
    setSelectedNodes,
    setSelectedFaces,
    saveOperation,
  ]);

  return {
    cutSelectedNodes,
    splitSelectedNodes,
  };
};

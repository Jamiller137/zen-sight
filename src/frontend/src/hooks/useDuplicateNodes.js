import { useCallback } from "react";
import { createDuplicateNode, createDuplicateLinks } from "../utils/graphUtils";

export const useDuplicateNodes = ({
  graphData,
  setGraphData,
  selectedNodes,
  setSelectedNodes,
  setAffectedNodes,
  setDupOperations,
  saveOperation,
  selectedDupColor,
}) => {
  const dupSelectedNodes = useCallback(async () => {
    if (selectedNodes.size === 0) return;

    const selectedNodeIds = Array.from(selectedNodes);
    const duplicatedNodeIds = [];
    const nodeIdMapping = new Map();
    const timestamp = Date.now();

    // Apply color to selected nodes and create duplicates
    const newNodes = graphData.nodes.map((node) => {
      if (selectedNodes.has(node.id)) {
        return { ...node, color: selectedDupColor };
      }
      return node;
    });

    // Create duplicate nodes
    selectedNodeIds.forEach((originalId) => {
      const originalNode = graphData.nodes.find(
        (node) => node.id === originalId,
      );
      if (originalNode) {
        const duplicatedNode = createDuplicateNode(originalNode, timestamp);
        duplicatedNode.color = selectedDupColor;

        newNodes.push(duplicatedNode);
        duplicatedNodeIds.push(duplicatedNode.id);
        nodeIdMapping.set(originalId, duplicatedNode.id);
      }
    });

    // Create new links
    const newLinks = createDuplicateLinks(
      graphData,
      selectedNodes,
      nodeIdMapping,
    );

    // Create duplicate faces
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
          id: `${face.id}_duplicate_${timestamp}`,
          nodes: newFaceNodes,
        });
      }
    });

    const dupOperation = {
      id: timestamp,
      color: selectedDupColor,
      originalNodes: new Set(selectedNodeIds),
      duplicatedNodes: new Set(duplicatedNodeIds),
      timestamp: new Date().toLocaleTimeString(),
    };

    setDupOperations((prev) => [...prev, dupOperation]);

    const newGraphData = {
      nodes: [...newNodes],
      links: [...newLinks],
      faces: [...newFaces],
    };

    setGraphData(newGraphData);

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
        saveOperation(
          "duplicate_nodes",
          `Duplicated ${selectedNodeIds.length} nodes`,
          {
            originalNodeIds: selectedNodeIds,
            duplicatedNodeIds: duplicatedNodeIds,
            dupColor: selectedDupColor,
            affectedNodeIds: [...selectedNodeIds, ...duplicatedNodeIds],
          },
        ),
      500,
    );
  }, [
    selectedNodes,
    graphData,
    setDupOperations,
    setGraphData,
    setAffectedNodes,
    setSelectedNodes,
    saveOperation,
    selectedDupColor,
  ]);

  return { dupSelectedNodes };
};

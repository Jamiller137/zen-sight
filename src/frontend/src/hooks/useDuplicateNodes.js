import { useCallback } from "react";
import {
  createDuplicateNode,
  createDuplicateLinks,
  createDuplicateFaces,
} from "../utils/graphUtils";

export const useDuplicateNodes = ({
  graphData,
  setGraphData,
  selectedNodes,
  setSelectedNodes,
  setAffectedNodes,
  setDupOperations,
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

    // Create duplicate faces using the utility function
    const newFaces = createDuplicateFaces(
      graphData,
      selectedNodes,
      nodeIdMapping,
      timestamp,
    );

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

    return {
      type: "duplicate_nodes",
      description: `Duplicated ${selectedNodeIds.length} nodes`,
      data: {
        originalNodeIds: selectedNodeIds,
        duplicatedNodeIds: duplicatedNodeIds,
        dupColor: selectedDupColor,
        affectedNodeIds: [...selectedNodeIds, ...duplicatedNodeIds],
      },
    };
  }, [
    selectedNodes,
    graphData,
    setDupOperations,
    setGraphData,
    setAffectedNodes,
    setSelectedNodes,
    selectedDupColor,
  ]);

  return { dupSelectedNodes };
};

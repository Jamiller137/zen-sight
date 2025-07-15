import { useCallback } from "react";
import { findAffectedNodesByCut, normalizeLink } from "../utils/graphUtils";

export const useCutNodes = ({
  graphData,
  setGraphData,
  selectedNodes,
  setSelectedNodes,
  setAffectedNodes,
  setCutOperations,
  selectedCutColor,
}) => {
  const cutSelectedNodes = useCallback(async () => {
    if (selectedNodes.size === 0) return;

    const selectedNodeIds = Array.from(selectedNodes);
    const newAffectedNodes = findAffectedNodesByCut(graphData, selectedNodes);

    const cutOperation = {
      id: Date.now(),
      color: selectedCutColor,
      affectedNodes: new Set(newAffectedNodes),
      timestamp: new Date().toLocaleTimeString(),
    };

    setCutOperations((prev) => [...prev, cutOperation]);

    // Update nodes
    const newNodes = graphData.nodes
      .filter((node) => !selectedNodes.has(node.id))
      .map((node) => {
        if (newAffectedNodes.has(node.id)) {
          return { ...node, color: selectedCutColor };
        }
        return node;
      });

    // Update links
    const newLinks = graphData.links
      .filter((link) => {
        const sourceId =
          typeof link.source === "object" ? link.source.id : link.source;
        const targetId =
          typeof link.target === "object" ? link.target.id : link.target;
        return !selectedNodes.has(sourceId) && !selectedNodes.has(targetId);
      })
      .map(normalizeLink);

    // Update faces
    const newFaces =
      graphData.faces?.filter(
        (face) => !face.nodes.some((nodeId) => selectedNodes.has(nodeId)),
      ) || [];

    const newGraphData = {
      nodes: [...newNodes],
      links: [...newLinks],
      faces: [...newFaces],
    };

    setGraphData(newGraphData);

    setAffectedNodes((prev) => {
      const updated = new Set(prev);
      newAffectedNodes.forEach((nodeId) => updated.add(nodeId));
      return updated;
    });

    setSelectedNodes(new Set());

    return {
      type: "cut_nodes",
      description: `Cut ${selectedNodeIds.length} nodes`,
      data: {
        nodeIds: selectedNodeIds,
        cutColor: selectedCutColor,
        affectedNodeIds: Array.from(newAffectedNodes),
      },
    };
  }, [
    selectedNodes,
    graphData,
    setCutOperations,
    setGraphData,
    setAffectedNodes,
    setSelectedNodes,
    selectedCutColor,
  ]);

  return { cutSelectedNodes };
};

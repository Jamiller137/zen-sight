import { useCallback } from "react";

export const useGraphOperations = (
  graphData,
  setGraphData,
  selectedNodes,
  setSelectedNodes,
  setSelectedFaces,
  setAffectedNodes,
  setCutOperations,
  setDupOperations,
  saveOperation,
  selectedCutColor,
  selectedDupColor,
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
      color: selectedCutColor,
      affectedNodes: new Set(newAffectedNodes),
      timestamp: new Date().toLocaleTimeString(),
    };

    setCutOperations((prev) => [...prev, cutOperation]);

    // Remove selected nodes and apply colors to affected nodes
    const newNodes = graphData.nodes
      .filter((node) => !selectedNodes.has(node.id))
      .map((node) => {
        if (newAffectedNodes.has(node.id)) {
          return { ...node, color: selectedCutColor };
        }
        return node;
      });

    // Normalize links and filter out connections to cut nodes
    const newLinks = graphData.links
      .filter((link) => {
        const sourceId =
          typeof link.source === "object" ? link.source.id : link.source;
        const targetId =
          typeof link.target === "object" ? link.target.id : link.target;
        return !selectedNodes.has(sourceId) && !selectedNodes.has(targetId);
      })
      .map((link) => {
        // Normalize link to use string IDs
        const sourceId =
          typeof link.source === "object" ? link.source.id : link.source;
        const targetId =
          typeof link.target === "object" ? link.target.id : link.target;

        return {
          ...link,
          source: sourceId,
          target: targetId,
        };
      });

    const newFaces =
      graphData.faces?.filter(
        (face) => !face.nodes.some((nodeId) => selectedNodes.has(nodeId)),
      ) || [];

    // Create a completely fresh graph data object
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
    setSelectedFaces(new Set());

    // Save operation
    setTimeout(
      () =>
        saveOperation("cut_nodes", `Cut ${selectedNodeIds.length} nodes`, {
          nodeIds: selectedNodeIds,
          cutColor: selectedCutColor,
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
    selectedCutColor,
  ]);

  const dupSelectedNodes = useCallback(async () => {
    if (selectedNodes.size === 0) return;

    const selectedNodeIds = Array.from(selectedNodes);
    const duplicatedNodeIds = [];
    const nodeIdMapping = new Map();

    // Apply color to selected nodes
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
        const duplicatedId = `${originalId}_duplicate_${Date.now()}`;
        const duplicatedNode = {
          ...originalNode,
          id: duplicatedId,
          color: selectedDupColor,
          x: (originalNode.x || 0) + (Math.random() - 0.5) * 20,
          y: (originalNode.y || 0) + (Math.random() - 0.5) * 20,
          z: (originalNode.z || 0) + (Math.random() - 0.5) * 20,
        };

        newNodes.push(duplicatedNode);
        duplicatedNodeIds.push(duplicatedId);
        nodeIdMapping.set(originalId, duplicatedId);
      }
    });

    // create new links structure
    const newLinks = [];

    graphData.links.forEach((originalLink) => {
      const sourceId =
        typeof originalLink.source === "object"
          ? originalLink.source.id
          : originalLink.source;
      const targetId =
        typeof originalLink.target === "object"
          ? originalLink.target.id
          : originalLink.target;

      // Create a normalized version of the original link
      const normalizedLink = {
        ...originalLink,
        source: sourceId,
        target: targetId,
      };

      // keep the original link with normalized IDs
      newLinks.push(normalizedLink);

      // Create additional links for duplicated nodes
      if (selectedNodes.has(sourceId) && !selectedNodes.has(targetId)) {
        const duplicatedSourceId = nodeIdMapping.get(sourceId);
        if (duplicatedSourceId) {
          newLinks.push({
            ...normalizedLink,
            source: duplicatedSourceId,
            target: targetId,
          });
        }
      } else if (!selectedNodes.has(sourceId) && selectedNodes.has(targetId)) {
        const duplicatedTargetId = nodeIdMapping.get(targetId);
        if (duplicatedTargetId) {
          newLinks.push({
            ...normalizedLink,
            source: sourceId,
            target: duplicatedTargetId,
          });
        }
      } else if (selectedNodes.has(sourceId) && selectedNodes.has(targetId)) {
        // Link between duplicated nodes
        const duplicatedSourceId = nodeIdMapping.get(sourceId);
        const duplicatedTargetId = nodeIdMapping.get(targetId);
        if (duplicatedSourceId && duplicatedTargetId) {
          newLinks.push({
            ...normalizedLink,
            source: duplicatedSourceId,
            target: duplicatedTargetId,
          });
        }
      }
    });

    // Create faces for duplicated nodes
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
          id: `${face.id}_duplicate_${Date.now()}`,
          nodes: newFaceNodes,
        });
      }
    });

    const dupOperation = {
      id: Date.now(),
      color: selectedDupColor,
      originalNodes: new Set(selectedNodeIds),
      duplicatedNodes: new Set(duplicatedNodeIds),
      timestamp: new Date().toLocaleTimeString(),
    };

    setDupOperations((prev) => [...prev, dupOperation]);

    // Create a completely fresh graph data object
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
    setSelectedFaces,
    saveOperation,
    selectedDupColor,
  ]);

  return {
    cutSelectedNodes,
    dupSelectedNodes,
  };
};

export const normalizeLink = (link) => {
  const sourceId =
    typeof link.source === "object" ? link.source.id : link.source;
  const targetId =
    typeof link.target === "object" ? link.target.id : link.target;

  return {
    ...link,
    source: sourceId,
    target: targetId,
  };
};

export const findAffectedNodesByCut = (graphData, selectedNodes) => {
  const affectedNodes = new Set();

  // Find nodes affected by link cuts
  graphData.links.forEach((link) => {
    const sourceId =
      typeof link.source === "object" ? link.source.id : link.source;
    const targetId =
      typeof link.target === "object" ? link.target.id : link.target;

    if (selectedNodes.has(sourceId) && !selectedNodes.has(targetId)) {
      affectedNodes.add(targetId);
    }
    if (selectedNodes.has(targetId) && !selectedNodes.has(sourceId)) {
      affectedNodes.add(sourceId);
    }
  });

  // Find nodes affected by face cuts
  graphData.faces?.forEach((face) => {
    const hasSelectedNode = face.nodes.some((nodeId) =>
      selectedNodes.has(nodeId),
    );
    if (hasSelectedNode) {
      face.nodes.forEach((nodeId) => {
        if (!selectedNodes.has(nodeId)) {
          affectedNodes.add(nodeId);
        }
      });
    }
  });

  return affectedNodes;
};

export const createDuplicateNode = (originalNode, timestamp) => {
  const duplicatedId = `${originalNode.id}_duplicate_${timestamp}`;
  return {
    ...originalNode,
    id: duplicatedId,
    x: (originalNode.x || 0) + (Math.random() - 0.5) * 20,
    y: (originalNode.y || 0) + (Math.random() - 0.5) * 20,
    z: (originalNode.z || 0) + (Math.random() - 0.5) * 20,
  };
};

export const createDuplicateLinks = (
  graphData,
  selectedNodes,
  nodeIdMapping,
) => {
  const newLinks = [];

  graphData.links.forEach((originalLink) => {
    const normalizedLink = normalizeLink(originalLink);
    const { source: sourceId, target: targetId } = normalizedLink;

    // Keep original link
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

  return newLinks;
};

export const createDuplicateFaces = (
  graphData,
  selectedNodes,
  nodeIdMapping,
) => {
  // If there are no faces
  if (!graphData.faces || graphData.faces.length === 0) {
    return [];
  }

  const newFaces = [];

  graphData.faces.forEach((originalFace) => {
    // Always keep the original face
    newFaces.push(originalFace);

    // Check if this face contains any selected nodes
    const selectedNodesInFace = originalFace.nodes.filter((nodeId) =>
      selectedNodes.has(nodeId),
    );

    if (selectedNodesInFace.length === 0) {
      return;
    }

    // 1: All nodes in the face were selected - create a fully duplicated face
    if (selectedNodesInFace.length === originalFace.nodes.length) {
      const duplicatedFace = {
        ...originalFace,
        id: `${originalFace.id || "face"}_duplicate_${Date.now()}`,
        nodes: originalFace.nodes.map((nodeId) => nodeIdMapping.get(nodeId)),
      };
      newFaces.push(duplicatedFace);
    }
    // 2: Some nodes in the face were selected: create mixed faces
    else {
      // For each selected node in the face, create a new face that includes its
      // duplicated version along with the original non-selected nodes
      selectedNodesInFace.forEach((selectedNodeId) => {
        const duplicatedNodeId = nodeIdMapping.get(selectedNodeId);
        if (duplicatedNodeId) {
          const newFaceNodes = originalFace.nodes.map((nodeId) =>
            nodeId === selectedNodeId ? duplicatedNodeId : nodeId,
          );

          newFaces.push({
            ...originalFace,
            id: `${originalFace.id || "face"}_partial_duplicate_${selectedNodeId}_${Date.now()}`,
            nodes: newFaceNodes,
          });
        }
      });
    }
  });

  return newFaces;
};

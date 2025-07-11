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

import { useState, useCallback } from "react";

export const useSelection = () => {
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectedFaces, setSelectedFaces] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState("single");

  const clearSelections = useCallback(() => {
    setSelectedNodes(new Set());
    setSelectedFaces(new Set());
  }, []);

  const handleNodeClick = useCallback(
    (node, event) => {
      if (selectionMode === "none") return;

      const nodeId = node.id;
      setSelectedNodes((prev) => {
        const newSelection = new Set(prev);

        if (selectionMode === "single") {
          newSelection.clear();
          newSelection.add(nodeId);
        } else if (selectionMode === "multi") {
          if (event?.ctrlKey || event?.metaKey) {
            if (newSelection.has(nodeId)) {
              newSelection.delete(nodeId);
            } else {
              newSelection.add(nodeId);
            }
          } else {
            newSelection.clear();
            newSelection.add(nodeId);
          }
        }

        return newSelection;
      });
    },
    [selectionMode],
  );

  const handleFaceClick = useCallback(
    (faceId, event) => {
      if (selectionMode === "none") return;

      setSelectedFaces((prev) => {
        const newSelection = new Set(prev);

        if (selectionMode === "single") {
          newSelection.clear();
          newSelection.add(faceId);
        } else if (selectionMode === "multi") {
          if (event?.ctrlKey || event?.metaKey) {
            if (newSelection.has(faceId)) {
              newSelection.delete(faceId);
            } else {
              newSelection.add(faceId);
            }
          } else {
            newSelection.clear();
            newSelection.add(faceId);
          }
        }

        return newSelection;
      });
    },
    [selectionMode],
  );

  return {
    selectedNodes,
    selectedFaces,
    selectionMode,
    setSelectionMode,
    clearSelections,
    handleNodeClick,
    handleFaceClick,
    setSelectedNodes,
    setSelectedFaces,
  };
};

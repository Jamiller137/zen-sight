import { useState, useCallback, useEffect } from "react";
import { isPointInPolygon } from "../utils/selectionUtils";
import * as THREE from "three";

export const useLasso = (
  selectionMode,
  graphType,
  graphData,
  setSelectedNodes,
  graphRef,
) => {
  const [isLassoMode, setIsLassoMode] = useState(false);
  const [lassoPath, setLassoPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const shouldEnableLasso = selectionMode === "lasso" && graphType === "3D";
    setIsLassoMode(shouldEnableLasso);
    if (!shouldEnableLasso) {
      setLassoPath([]);
      setIsDrawing(false);
    }
  }, [selectionMode, graphType]);

  const getNodeScreenCoords = useCallback(
    (node) => {
      if (!graphRef?.current || graphType !== "3D") return null;

      const fg = graphRef.current;
      const camera = fg.camera();
      const renderer = fg.renderer();

      if (!camera || !renderer) return null;

      try {
        const vector = new THREE.Vector3(node.x || 0, node.y || 0, node.z || 0);
        vector.project(camera);

        const canvas = renderer.domElement;
        const rect = canvas.getBoundingClientRect();

        return {
          x: (vector.x * 0.5 + 0.5) * rect.width,
          y: (-vector.y * 0.5 + 0.5) * rect.height,
        };
      } catch (error) {
        console.error("Error getting node screen coordinates:", error);
        return null;
      }
    },
    [graphType, graphRef],
  );

  const handleLassoSelection = useCallback(() => {
    if (lassoPath.length < 3 || graphType !== "3D") return;

    const newSelectedNodes = new Set();

    graphData.nodes.forEach((node) => {
      const screenCoords = getNodeScreenCoords(node);
      if (screenCoords) {
        const isInside = isPointInPolygon(screenCoords, lassoPath);
        if (isInside) {
          newSelectedNodes.add(node.id);
        }
      }
    });

    setSelectedNodes(newSelectedNodes);
    setLassoPath([]);
    setIsDrawing(false);
  }, [
    lassoPath,
    graphData.nodes,
    getNodeScreenCoords,
    graphType,
    setSelectedNodes,
  ]);

  const handleOverlayMouseDown = useCallback(
    (event) => {
      if (!isLassoMode || graphType !== "3D") return;

      event.preventDefault();
      event.stopPropagation();

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setIsDrawing(true);
      setLassoPath([{ x, y }]);
    },
    [isLassoMode, graphType],
  );

  const handleOverlayMouseMove = useCallback(
    (event) => {
      if (!isDrawing || !isLassoMode || graphType !== "3D") return;

      event.preventDefault();
      event.stopPropagation();

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setLassoPath((prev) => [...prev, { x, y }]);
    },
    [isDrawing, isLassoMode, graphType],
  );

  const handleOverlayMouseUp = useCallback(
    (event) => {
      if (!isDrawing || !isLassoMode || graphType !== "3D") return;

      event.preventDefault();
      event.stopPropagation();

      setIsDrawing(false);
      // Call handleLassoSelection after a small delay to ensure the path is complete
      setTimeout(() => handleLassoSelection(), 50);
    },
    [isDrawing, isLassoMode, handleLassoSelection, graphType],
  );

  return {
    isLassoMode,
    lassoPath,
    isDrawing,
    handleLassoSelection,
    handleOverlayMouseDown,
    handleOverlayMouseMove,
    handleOverlayMouseUp,
  };
};

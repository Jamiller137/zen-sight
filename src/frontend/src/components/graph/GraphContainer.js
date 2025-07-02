import React, {
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import ForceGraph2D from "react-force-graph-2d";
import ForceGraph3D from "react-force-graph-3d";
import LassoOverlay from "./LassoOverlay";
import LoadingSpinner from "../common/LoadingSpinner";
import { useFaceRendering } from "../../hooks/useFaceRendering";

const GraphContainer = forwardRef(
  (
    {
      graphData,
      graphConfig,
      graphType,
      loading,
      showFaces,
      selectedNodes,
      selectedFaces,
      cutOperations,
      splitOperations,
      isLassoMode,
      lassoPath,
      isDrawing,
      forceGraphKey,
      isReplayingOperation,
      onNodeClick,
      onFaceClick,
      onLassoMouseDown,
      onLassoMouseMove,
      onLassoMouseUp,
    },
    forwardedRef,
  ) => {
    // Always call useRef - never conditionally
    const localGraphRef = useRef();

    // Use the forwarded ref if provided, otherwise use local ref
    const graphRef = forwardedRef || localGraphRef;

    // Expose the ref to parent component if needed
    useImperativeHandle(forwardedRef, () => localGraphRef.current, []);

    const { paintFaces2D, updateFaces3D, cleanupFaces3D, handle3DEngineTick } =
      useFaceRendering(
        graphRef,
        graphType,
        showFaces,
        graphData,
        graphConfig,
        selectedFaces,
        isReplayingOperation,
      );

    const getNodeColor = useCallback(
      (node) => {
        if (selectedNodes.has(node.id)) {
          return graphConfig.selectedNodeColor || "#ff6969";
        }

        for (let i = splitOperations.length - 1; i >= 0; i--) {
          if (splitOperations[i].duplicatedNodes.has(node.id)) {
            return splitOperations[i].color;
          }
        }

        for (let i = cutOperations.length - 1; i >= 0; i--) {
          if (cutOperations[i].affectedNodes.has(node.id)) {
            return cutOperations[i].color;
          }
        }

        return node.color || graphConfig.nodeColor || "#696969";
      },
      [selectedNodes, cutOperations, splitOperations, graphConfig],
    );

    const getNodeSize = useCallback(
      (node) => {
        const baseSize = node.size || graphConfig.nodeSize || 5;
        return selectedNodes.has(node.id) ? baseSize * 1.5 : baseSize;
      },
      [selectedNodes, graphConfig],
    );

    const handle3DClick = useCallback(
      (object, event) => {
        if (object && object.userData?.isFace) {
          onFaceClick(object.userData.faceId, event);
        }
      },
      [onFaceClick],
    );

    const getGraphProps = useCallback(() => {
      const baseProps = {
        ref: graphRef,
        graphData: graphData,
        ...graphConfig,
        nodeColor: getNodeColor,
        nodeVal: getNodeSize,
        onNodeClick: onNodeClick,
      };

      if (graphType === "2D") {
        return {
          ...baseProps,
          onRenderFramePost: paintFaces2D,
        };
      } else {
        return {
          ...baseProps,
          onEngineTick: handle3DEngineTick,
          onObjectClick: handle3DClick,
          enableNodeDrag: !isLassoMode,
          enableNavigationControls: !isLassoMode,
        };
      }
    }, [
      graphData,
      graphConfig,
      getNodeColor,
      getNodeSize,
      onNodeClick,
      graphType,
      paintFaces2D,
      handle3DEngineTick,
      handle3DClick,
      isLassoMode,
      graphRef,
    ]);

    useEffect(() => {
      if (graphType === "3D" && !loading && !isReplayingOperation) {
        const initTimer = setTimeout(() => updateFaces3D(), 500);
        const updateTimer = setInterval(() => updateFaces3D(), 1000);
        const stopTimer = setTimeout(() => clearInterval(updateTimer), 10000);

        return () => {
          clearTimeout(initTimer);
          clearInterval(updateTimer);
          clearTimeout(stopTimer);
        };
      }
    }, [graphType, loading, updateFaces3D, showFaces, isReplayingOperation]);

    useEffect(() => {
      return () => {
        if (graphType === "3D") {
          cleanupFaces3D();
        }
      };
    }, [graphType, cleanupFaces3D]);

    const ForceGraphComponent =
      graphType === "3D" ? ForceGraph3D : ForceGraph2D;

    if (loading || isReplayingOperation) {
      return (
        <div className="graph-container">
          <LoadingSpinner
            message={loading ? "Loading..." : "Replaying Operation..."}
          />
        </div>
      );
    }

    return (
      <div className="graph-container">
        <ForceGraphComponent
          key={`${graphType}-${forceGraphKey}`}
          {...getGraphProps()}
        />

        {isLassoMode && graphType === "3D" && (
          <LassoOverlay
            lassoPath={lassoPath}
            isDrawing={isDrawing}
            onMouseDown={onLassoMouseDown}
            onMouseMove={onLassoMouseMove}
            onMouseUp={onLassoMouseUp}
          />
        )}
      </div>
    );
  },
);

GraphContainer.displayName = "GraphContainer";

export default GraphContainer;

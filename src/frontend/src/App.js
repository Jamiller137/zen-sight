import { useState, useEffect, useCallback, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import axios from "axios";
import "./App.css";

function App() {
  const [graphData, setGraphData] = useState({
    nodes: [],
    links: [],
    faces: [],
  });
  const [graphConfig, setGraphConfig] = useState({});
  const [graphType, setGraphType] = useState("3D");
  const [loading, setLoading] = useState(true);
  const [showFaces, setShowFaces] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectedFaces, setSelectedFaces] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState("single");
  const [affectedNodes, setAffectedNodes] = useState(new Set());
  const [cutOperations, setCutOperations] = useState([]);
  const [splitOperations, setSplitOperations] = useState([]);
  const [selectedCutColor, setSelectedCutColor] = useState("#ff6969");
  const [selectedSplitColor, setSelectedSplitColor] = useState("#69ff69");

  const [operationsHistory, setOperationsHistory] = useState([]);
  const [currentOperationIndex, setCurrentOperationIndex] = useState(-1);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isReplayingOperation, setIsReplayingOperation] = useState(false);
  const [forceGraphKey, setForceGraphKey] = useState(0);

  const predefinedColors = [
    "#69ff69",
    "#ffff69",
    "#69ffff",
    "#ffa500",
    "#6969ff",
  ];

  const [isLassoMode, setIsLassoMode] = useState(false);
  const [lassoPath, setLassoPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const graphRef = useRef();
  const faceMeshesRef = useRef([]);
  const overlayRef = useRef();
  const cleanupTimeoutRef = useRef();

  useEffect(() => {
    fetchGraphData();

    return () => {
      performCompleteCleanup();
    };
  }, []);

  useEffect(() => {
    const shouldEnableLasso = selectionMode === "lasso" && graphType === "3D";
    setIsLassoMode(shouldEnableLasso);
    if (!shouldEnableLasso) {
      setLassoPath([]);
      setIsDrawing(false);
    }
  }, [selectionMode, graphType]);

  const performCompleteCleanup = useCallback(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    if (faceMeshesRef.current.length > 0) {
      faceMeshesRef.current.forEach((mesh) => {
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
      });
      faceMeshesRef.current = [];
    }

    if (graphRef.current) {
      if (graphRef.current.d3Force) {
        graphRef.current.d3Force("charge", null);
        graphRef.current.d3Force("link", null);
        graphRef.current.d3Force("center", null);
      }

      if (graphRef.current.tickCount) {
        graphRef.current.tickCount = 0;
      }

      if (graphRef.current.renderer && graphRef.current.renderer.dispose) {
        graphRef.current.renderer.dispose();
      }
    }
  }, []);

  const reconstructOperations = useCallback((history, upToIndex) => {
    const reconstructedCutOps = [];
    const reconstructedSplitOps = [];
    const allAffectedNodes = new Set();

    for (let i = 0; i <= upToIndex; i++) {
      const operation = history[i];
      if (operation && operation.data) {
        if (operation.type === "cut_nodes") {
          const cutOp = {
            id: Date.now() + i,
            color: operation.data.cutColor || "#ff6969",
            affectedNodes: new Set(operation.data.affectedNodeIds || []),
            timestamp: new Date(operation.timestamp).toLocaleTimeString(),
          };
          reconstructedCutOps.push(cutOp);
          cutOp.affectedNodes.forEach((nodeId) => allAffectedNodes.add(nodeId));
        } else if (operation.type === "split_nodes") {
          const splitOp = {
            id: Date.now() + i + 1000,
            color: operation.data.splitColor || "#69ff69",
            originalNodes: new Set(operation.data.originalNodeIds || []),
            duplicatedNodes: new Set(operation.data.duplicatedNodeIds || []),
            timestamp: new Date(operation.timestamp).toLocaleTimeString(),
          };
          reconstructedSplitOps.push(splitOp);
          splitOp.duplicatedNodes.forEach((nodeId) =>
            allAffectedNodes.add(nodeId),
          );
        }
      }
    }

    return {
      cutOperations: reconstructedCutOps,
      splitOperations: reconstructedSplitOps,
      affectedNodes: allAffectedNodes,
    };
  }, []);

  const saveOperation = useCallback(
    async (type, description, data = {}) => {
      if (isReplayingOperation || loading) return;

      try {
        const operationData = {
          type,
          description,
          data,
          timestamp: new Date().toISOString(),
        };

        const response = await axios.post(
          "http://127.0.0.1:5050/api/save-operation",
          operationData,
        );

        if (response.data.success) {
          await fetchOperationsHistory();
        }
      } catch (error) {
        console.error("Error saving operation:", error);
      }
    },
    [isReplayingOperation, loading],
  );

  const fetchOperationsHistory = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:5050/api/operations-history",
      );
      const history = response.data.history || [];
      setOperationsHistory(history);

      if (!isReplayingOperation) {
        setCurrentOperationIndex(history.length - 1);
      }
    } catch (error) {
      console.error("Error fetching operations history:", error);
    }
  };

  const replayToOperation = async (operationIndex) => {
    try {
      setIsReplayingOperation(true);

      performCompleteCleanup();

      const response = await axios.get(
        `http://127.0.0.1:5050/api/replay-to-operation/${operationIndex}`,
      );
      const replayedGraph = response.data.graph;

      clearSelections();

      const {
        cutOperations: reconstructedCutOps,
        splitOperations: reconstructedSplitOps,
        affectedNodes: reconstructedAffectedNodes,
      } = reconstructOperations(operationsHistory, operationIndex);

      setCutOperations(reconstructedCutOps);
      setSplitOperations(reconstructedSplitOps);
      setAffectedNodes(reconstructedAffectedNodes);

      setForceGraphKey((prev) => prev + 1);

      setGraphData({
        nodes: [...replayedGraph.nodes],
        links: [...replayedGraph.links],
        faces: [...(replayedGraph.faces || [])],
      });

      setCurrentOperationIndex(operationIndex);

      cleanupTimeoutRef.current = setTimeout(() => {
        setIsReplayingOperation(false);
      }, 60);
    } catch (error) {
      console.error("Error replaying to operation:", error);
      setIsReplayingOperation(false);
    }
  };

  const fetchGraphData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5050/api/graph-data");
      const { graphType: type, data, config } = response.data;

      setGraphType(type);
      setGraphData(data);
      setGraphConfig(config);
      setLoading(false);

      setTimeout(async () => {
        await fetchOperationsHistory();
        await saveOperation("initial_load", "Initial graph load");
      }, 1000);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      setLoading(false);
    }
  };

  const toggleGraphType = async () => {
    const newType = graphType === "3D" ? "2D" : "3D";

    performCompleteCleanup();

    setGraphType(newType);
    clearSelections();

    setForceGraphKey((prev) => prev + 1);

    if (newType === "2D" && selectionMode === "lasso") {
      setSelectionMode("single");
    }
  };

  const clearSelections = () => {
    setSelectedNodes(new Set());
    setSelectedFaces(new Set());
    setLassoPath([]);
    setIsDrawing(false);
  };

  const splitSelectedNodes = useCallback(async () => {
    if (selectedNodes.size === 0) return;

    const selectedNodeIds = Array.from(selectedNodes);
    const duplicatedNodeIds = [];
    const nodeIdMapping = new Map();

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
      color: selectedSplitColor,
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
          splitColor: selectedSplitColor,
          affectedNodeIds: [...selectedNodeIds, ...duplicatedNodeIds],
        }),
      500,
    );
  }, [selectedNodes, graphData, selectedSplitColor, saveOperation]);

  const cutSelectedNodes = useCallback(async () => {
    if (selectedNodes.size === 0) return;

    const selectedNodeIds = Array.from(selectedNodes);
    const newAffectedNodes = new Set();

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

    setTimeout(
      () =>
        saveOperation("cut_nodes", `Cut ${selectedNodeIds.length} nodes`, {
          nodeIds: selectedNodeIds,
          cutColor: selectedCutColor,
          affectedNodeIds: Array.from(newAffectedNodes),
        }),
      500,
    );
  }, [selectedNodes, graphData, selectedCutColor, saveOperation]);

  const isPointInPolygon = (point, polygon) => {
    if (polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (
        polygon[i].y > point.y !== polygon[j].y > point.y &&
        point.x <
          ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) /
            (polygon[j].y - polygon[i].y) +
            polygon[i].x
      ) {
        inside = !inside;
      }
    }
    return inside;
  };

  const getNodeScreenCoords = useCallback(
    (node) => {
      if (!graphRef.current || graphType !== "3D") return null;

      const fg = graphRef.current;
      const camera = fg.camera();
      const renderer = fg.renderer();

      if (!camera || !renderer) return null;

      const vector = new THREE.Vector3(node.x || 0, node.y || 0, node.z || 0);
      vector.project(camera);

      const canvas = renderer.domElement;
      return {
        x: (vector.x * 0.5 + 0.5) * canvas.clientWidth,
        y: (-vector.y * 0.5 + 0.5) * canvas.clientHeight,
      };
    },
    [graphType],
  );

  const handleLassoSelection = useCallback(() => {
    if (lassoPath.length < 3 || graphType !== "3D") return;

    const newSelectedNodes = new Set();

    graphData.nodes.forEach((node) => {
      const screenCoords = getNodeScreenCoords(node);
      if (screenCoords && isPointInPolygon(screenCoords, lassoPath)) {
        newSelectedNodes.add(node.id);
      }
    });

    setSelectedNodes(newSelectedNodes);
    setLassoPath([]);
    setIsDrawing(false);
  }, [lassoPath, graphData.nodes, getNodeScreenCoords, graphType]);

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
      handleLassoSelection();
    },
    [isDrawing, isLassoMode, handleLassoSelection, graphType],
  );

  const handleNodeClick = useCallback(
    (node, event) => {
      if (
        selectionMode === "none" ||
        (selectionMode === "lasso" && graphType === "2D")
      )
        return;

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
    [selectionMode, graphType],
  );

  const handleFaceClick = useCallback(
    (faceId, event) => {
      if (
        selectionMode === "none" ||
        (selectionMode === "lasso" && graphType === "2D")
      )
        return;

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
    [selectionMode, graphType],
  );

  const handle3DClick = useCallback(
    (object, event) => {
      if (object && object.userData?.isFace) {
        handleFaceClick(object.userData.faceId, event);
      }
    },
    [handleFaceClick],
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

  const cleanupFaces3D = useCallback(() => {
    if (!graphRef.current || graphType !== "3D") return;

    const fg = graphRef.current;
    if (!fg.scene) return;

    const scene = fg.scene();
    faceMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    faceMeshesRef.current = [];
  }, [graphType]);

  const toggleFaces = () => {
    const newShowFaces = !showFaces;
    setShowFaces(newShowFaces);

    if (!newShowFaces && graphType === "3D") {
      cleanupFaces3D();
    }
  };

  const paintFaces2D = useCallback(
    (ctx) => {
      if (!showFaces || !graphData.faces?.length || !graphData.nodes) return;

      ctx.save();

      const nodeMap = {};
      graphData.nodes.forEach((node) => {
        if (node.x !== undefined && node.y !== undefined) {
          nodeMap[node.id] = { x: node.x, y: node.y };
        }
      });

      graphData.faces.forEach((face) => {
        const positions = face.nodes
          .map((nodeId) => nodeMap[nodeId])
          .filter((pos) => pos);

        if (positions.length === 3) {
          const isSelected = selectedFaces.has(face.id);

          ctx.beginPath();
          ctx.moveTo(positions[0].x, positions[0].y);
          ctx.lineTo(positions[1].x, positions[1].y);
          ctx.lineTo(positions[2].x, positions[2].y);
          ctx.closePath();

          ctx.fillStyle = isSelected
            ? graphConfig.selectedFaceFillColor || "rgba(255, 107, 107, 0.4)"
            : graphConfig.faceFillColor || "rgba(100, 150, 250, 0.2)";
          ctx.fill();

          ctx.strokeStyle = isSelected
            ? graphConfig.selectedFaceStrokeColor || "rgba(255, 107, 107, 0.8)"
            : graphConfig.faceStrokeColor || "rgba(100, 150, 250, 0.5)";
          ctx.lineWidth = isSelected ? 2 : graphConfig.faceStrokeWidth || 1;
          ctx.stroke();
        }
      });

      ctx.restore();
    },
    [showFaces, graphData, graphConfig, selectedFaces],
  );

  const updateFaces3D = useCallback(() => {
    if (!graphRef.current || graphType !== "3D" || isReplayingOperation) return;

    const fg = graphRef.current;
    if (!fg.scene) return;

    const scene = fg.scene();

    faceMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    faceMeshesRef.current = [];

    if (!showFaces || !graphData.faces?.length) return;

    const nodeMap = {};
    graphData.nodes.forEach((node) => {
      nodeMap[node.id] = {
        x: node.x || 0,
        y: node.y || 0,
        z: node.z || 0,
      };
    });

    graphData.faces.forEach((face) => {
      const positions = face.nodes
        .map((nodeId) => nodeMap[nodeId])
        .filter((pos) => pos);

      if (positions.length === 3) {
        const isSelected = selectedFaces.has(face.id);

        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(
            isSelected
              ? graphConfig.selectedFaceFillColor || "#ff6b6b"
              : graphConfig.faceFillColor || "#6496fa",
          ),
          opacity: isSelected ? 0.6 : graphConfig.faceOpacity || 0.3,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          positions[0].x,
          positions[0].y,
          positions[0].z,
          positions[1].x,
          positions[1].y,
          positions[1].z,
          positions[2].x,
          positions[2].y,
          positions[2].z,
        ]);

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3),
        );
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { isFace: true, faceId: face.id };
        scene.add(mesh);
        faceMeshesRef.current.push(mesh);
      }
    });
  }, [
    showFaces,
    graphData,
    graphConfig,
    graphType,
    selectedFaces,
    isReplayingOperation,
  ]);

  const handle3DEngineTick = useCallback(() => {
    if (!graphRef.current || isReplayingOperation) return;

    const fg = graphRef.current;
    fg.tickCount = (fg.tickCount || 0) + 1;

    if (fg.tickCount % 60 === 0) {
      updateFaces3D();
    }
  }, [updateFaces3D, isReplayingOperation]);

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

  const getGraphProps = useCallback(() => {
    const baseProps = {
      ref: graphRef,
      graphData: graphData,
      ...graphConfig,
      nodeColor: getNodeColor,
      nodeVal: getNodeSize,
      onNodeClick: handleNodeClick,
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
    handleNodeClick,
    graphType,
    paintFaces2D,
    handle3DEngineTick,
    handle3DClick,
    isLassoMode,
  ]);

  const getAvailableSelectionModes = () => {
    if (graphType === "2D") {
      return [
        { value: "single", label: "Single Select" },
        { value: "multi", label: "Multi Select" },
        { value: "none", label: "No Selection" },
      ];
    } else {
      return [
        { value: "single", label: "Single Select" },
        { value: "multi", label: "Multi Select" },
        { value: "lasso", label: "Lasso Select" },
        { value: "none", label: "No Selection" },
      ];
    }
  };

  const ForceGraphComponent = graphType === "3D" ? ForceGraph3D : ForceGraph2D;

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-left">
          <h1>Zen Sight</h1>
        </div>

        <div className="header-center">
          <div className="view-controls">
            <button onClick={toggleGraphType} className="btn btn--default">
              {graphType === "3D" ? "2D" : "3D"}
            </button>

            {graphData.faces?.length > 0 && (
              <button onClick={toggleFaces} className="btn btn--default">
                {showFaces ? "Hide" : "Show"} Faces ({graphData.faces.length})
              </button>
            )}

            <select
              value={selectionMode}
              onChange={(e) => setSelectionMode(e.target.value)}
              className="selection-mode"
            >
              {getAvailableSelectionModes().map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="header-right">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="btn btn--default"
          >
            Timeline
          </button>
        </div>
      </header>

      {isLassoMode && graphType === "3D" && (
        <div className="status-bar">
          <div className="lasso-info">Click and drag to select nodes</div>
        </div>
      )}

      {(selectedNodes.size > 0 || selectedFaces.size > 0) && (
        <div className="selection-toolbar">
          <div className="selection-info">
            {selectedNodes.size > 0 && <span>{selectedNodes.size} nodes</span>}
            {selectedFaces.size > 0 && <span>{selectedFaces.size} faces</span>}
          </div>

          {selectedNodes.size > 0 && (
            <div className="action-controls">
              <div className="color-group">
                <label>Cut:</label>
                <input
                  type="color"
                  value={selectedCutColor}
                  onChange={(e) => setSelectedCutColor(e.target.value)}
                  className="color-picker"
                />
                <div className="predefined-colors">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      className={`color-button ${selectedCutColor === color ? "active" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedCutColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <button onClick={cutSelectedNodes} className="btn btn--danger">
                  Cut ({selectedNodes.size})
                </button>
              </div>

              <div className="color-group">
                <label>Split:</label>
                <input
                  type="color"
                  value={selectedSplitColor}
                  onChange={(e) => setSelectedSplitColor(e.target.value)}
                  className="color-picker"
                />
                <div className="predefined-colors">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      className={`color-button ${selectedSplitColor === color ? "active" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedSplitColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  onClick={splitSelectedNodes}
                  className="btn btn--warning"
                >
                  Split ({selectedNodes.size})
                </button>
              </div>

              <button onClick={clearSelections} className="btn btn--default">
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      <div className="main-content">
        {showTimeline && (
          <div className="timeline-sidebar">
            <div className="sidebar-header">
              <h3>Timeline</h3>
              <small>Grandfather Paradox Applies</small>
            </div>
            <div className="timeline-list">
              {operationsHistory.map((operation, index) => (
                <div
                  key={operation.id}
                  className={`timeline-item ${index === currentOperationIndex ? "active" : ""}`}
                  style={{ opacity: isReplayingOperation ? 0.6 : 1 }}
                  onClick={() =>
                    !isReplayingOperation && replayToOperation(index)
                  }
                >
                  <div className="timeline-content">
                    <div className="timeline-description">
                      {operation.description}
                    </div>
                    <div className="timeline-meta">
                      <span className="timeline-type">{operation.type}</span>
                      <span className="timeline-time">
                        {new Date(operation.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="graph-container">
          {loading || isReplayingOperation ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>{loading ? "Loading..." : "Replaying Operation..."}</p>
            </div>
          ) : (
            <>
              <ForceGraphComponent
                key={`${graphType}-${forceGraphKey}`}
                {...getGraphProps()}
              />

              {isLassoMode && graphType === "3D" && (
                <div
                  ref={overlayRef}
                  className="lasso-overlay"
                  onMouseDown={handleOverlayMouseDown}
                  onMouseMove={handleOverlayMouseMove}
                  onMouseUp={handleOverlayMouseUp}
                >
                  <svg className="lasso-svg">
                    {lassoPath.length > 1 && (
                      <path
                        d={`M ${lassoPath[0].x} ${lassoPath[0].y} ${lassoPath
                          .slice(1)
                          .map((p) => `L ${p.x} ${p.y}`)
                          .join(
                            " ",
                          )}${!isDrawing && lassoPath.length > 2 ? " Z" : ""}`}
                        stroke="#ff6969"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        fill="rgba(255, 105, 105, 0.1)"
                        fillRule="evenodd"
                      />
                    )}
                  </svg>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default App;

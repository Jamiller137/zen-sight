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
  const [selectionMode, setSelectionMode] = useState("multi"); // "single", "multi", "none"

  const graphRef = useRef();
  const faceMeshesRef = useRef([]);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5050/api/graph-data");
      const { graphType: type, data, config } = response.data;

      setGraphType(type);
      setGraphData(data);
      setGraphConfig(config);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      setLoading(false);
    }
  };

  const toggleGraphType = async () => {
    const newType = graphType === "3D" ? "2D" : "3D";
    try {
      const response = await axios.get(
        `http://127.0.0.1:5050/api/set-type/${newType}`,
      );
      const { graphType: type, data, config } = response.data;

      setGraphType(type);
      setGraphData(data);
      setGraphConfig(config);
      clearSelections();
    } catch (error) {
      console.error("Error switching graph type:", error);
    }
  };

  const clearSelections = () => {
    setSelectedNodes(new Set());
    setSelectedFaces(new Set());
  };

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
      return node.color || graphConfig.nodeColor || "#696969";
    },
    [selectedNodes, graphConfig],
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
      if (mesh.material) mesh.material.dispose();
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
    if (!graphRef.current || graphType !== "3D") return;

    const fg = graphRef.current;
    if (!fg.scene) return;

    const scene = fg.scene();

    faceMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
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
  }, [showFaces, graphData, graphConfig, graphType, selectedFaces]);

  const handle3DEngineTick = useCallback(() => {
    if (!graphRef.current) return;

    const fg = graphRef.current;
    fg.tickCount = (fg.tickCount || 0) + 1;

    if (fg.tickCount % 60 === 0) {
      updateFaces3D();
    }
  }, [updateFaces3D]);

  useEffect(() => {
    if (graphType === "3D" && !loading) {
      const initTimer = setTimeout(() => updateFaces3D(), 500);
      const updateTimer = setInterval(() => updateFaces3D(), 1000);
      const stopTimer = setTimeout(() => clearInterval(updateTimer), 10000);

      return () => {
        clearTimeout(initTimer);
        clearInterval(updateTimer);
        clearTimeout(stopTimer);
      };
    }
  }, [graphType, loading, updateFaces3D, showFaces]);

  const ForceGraphComponent = graphType === "3D" ? ForceGraph3D : ForceGraph2D;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Zen Sight</h1>
        <div className="controls">
          <button onClick={toggleGraphType} className="toggle-button">
            Switch to {graphType === "3D" ? "2D" : "3D"}
          </button>

          {graphData.faces?.length > 0 && (
            <button onClick={toggleFaces} className="toggle-button">
              {showFaces ? "Hide" : "Show"} Faces ({graphData.faces.length})
            </button>
          )}

          <select
            value={selectionMode}
            onChange={(e) => setSelectionMode(e.target.value)}
            className="selection-mode"
          >
            <option value="single">Single Select</option>
            <option value="multi">Multi Select</option>
            <option value="none">No Selection</option>
          </select>

          <button onClick={clearSelections} className="clear-button">
            Clear Selection
          </button>
        </div>

        {(selectedNodes.size > 0 || selectedFaces.size > 0) && (
          <div className="selection-info">
            {selectedNodes.size > 0 && <span>Nodes: {selectedNodes.size}</span>}
            {selectedFaces.size > 0 && <span>Faces: {selectedFaces.size}</span>}
          </div>
        )}
      </header>

      <div className="graph-container">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ForceGraphComponent
            ref={graphRef}
            graphData={graphData}
            {...graphConfig}
            nodeColor={getNodeColor}
            nodeVal={getNodeSize}
            onNodeClick={handleNodeClick}
            {...(graphType === "2D"
              ? { onRenderFramePost: paintFaces2D }
              : {
                  onEngineTick: handle3DEngineTick,
                  onObjectClick: handle3DClick,
                })}
          />
        )}
      </div>
    </div>
  );
}

export default App;

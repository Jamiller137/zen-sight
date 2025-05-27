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
  const graphRef = useRef();
  const faceMeshesRef = useRef([]);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5050/api/graph-data");
      const { graphType: type, data, config } = response.data;

      console.log("Received data:", data);
      console.log("Number of faces:", data.faces ? data.faces.length : 0);

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
    } catch (error) {
      console.error("Error switching graph type:", error);
    }
  };

  const cleanupFaces3D = useCallback(() => {
    if (!graphRef.current || graphType !== "3D") return;

    const fg = graphRef.current;
    if (!fg.scene) return;

    const scene = fg.scene();

    // Remove existing face meshes
    faceMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    faceMeshesRef.current = [];

    console.log("Removed all face meshes from 3D scene");
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
      if (!showFaces || !graphData.faces || graphData.faces.length === 0)
        return;
      if (!graphData.nodes) return;

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
          ctx.beginPath();
          ctx.moveTo(positions[0].x, positions[0].y);
          ctx.lineTo(positions[1].x, positions[1].y);
          ctx.lineTo(positions[2].x, positions[2].y);
          ctx.closePath();

          ctx.fillStyle =
            graphConfig.faceFillColor || "rgba(100, 150, 250, 0.2)";
          ctx.fill();

          ctx.strokeStyle =
            graphConfig.faceStrokeColor || "rgba(100, 150, 250, 0.5)";
          ctx.lineWidth = graphConfig.faceStrokeWidth || 1;
          ctx.stroke();
        }
      });

      ctx.restore();
    },
    [showFaces, graphData, graphConfig],
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

    if (!showFaces || !graphData.faces || graphData.faces.length === 0) return;

    const nodeMap = {};
    graphData.nodes.forEach((node) => {
      nodeMap[node.id] = {
        x: node.x || 0,
        y: node.y || 0,
        z: node.z || 0,
      };
    });

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(graphConfig.faceFillColor || "#6496fa"),
      opacity: graphConfig.faceOpacity || 0.3,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    graphData.faces.forEach((face) => {
      const positions = face.nodes
        .map((nodeId) => nodeMap[nodeId])
        .filter((pos) => pos);

      if (positions.length === 3) {
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

    console.log(
      `${showFaces ? "Added" : "Removed"} ${faceMeshesRef.current.length} face meshes`,
    );
  }, [showFaces, graphData, graphConfig, graphType]);

  useEffect(() => {
    if (graphType === "3D" && !loading) {
      // initial delay
      const initTimer = setTimeout(() => {
        updateFaces3D();
      }, 500);

      // update once per second
      const updateTimer = setInterval(() => {
        updateFaces3D();
      }, 1000);

      // stop updating after 10 seconds
      const stopTimer = setTimeout(() => {
        clearInterval(updateTimer);
      }, 10000);

      return () => {
        clearTimeout(initTimer);
        clearInterval(updateTimer);
        clearTimeout(stopTimer);
      };
    }
  }, [graphType, loading, updateFaces3D, showFaces]); // Added showFaces to dependencies

  const ForceGraphComponent = graphType === "3D" ? ForceGraph3D : ForceGraph2D;

  // also use onEngineTick for more updates
  const handle3DEngineTick = useCallback(() => {
    if (!graphRef.current) return;

    const fg = graphRef.current;
    fg.tickCount = (fg.tickCount || 0) + 1;

    if (fg.tickCount % 60 === 0) {
      updateFaces3D();
    }
  }, [updateFaces3D]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Zen Sight</h1>
        <div className="controls">
          <button onClick={toggleGraphType} className="toggle-button">
            Switch to {graphType === "3D" ? "2D" : "3D"}
          </button>
          {graphData.faces && graphData.faces.length > 0 && (
            <button onClick={toggleFaces} className="toggle-button">
              {showFaces ? "Hide" : "Show"} Faces ({graphData.faces.length})
            </button>
          )}
        </div>
      </header>
      <div className="graph-container">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ForceGraphComponent
            ref={graphRef}
            graphData={graphData}
            {...graphConfig}
            {...(graphType === "2D"
              ? {
                  onRenderFramePost: paintFaces2D,
                }
              : {
                  onEngineTick: handle3DEngineTick,
                })}
          />
        )}
      </div>
    </div>
  );
}

export default App;

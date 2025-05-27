import { useState, useEffect, useCallback, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import ForceGraph3D from "react-force-graph-3d";
import * as d3 from "d3";
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

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      const response = await axios.get("/api/graph-data");
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
      const response = await axios.get(`/api/set-type/${newType}`);
      const { graphType: type, data, config } = response.data;

      setGraphType(type);
      setGraphData(data);
      setGraphConfig(config);
    } catch (error) {
      console.error("Error switching graph type:", error);
    }
  };

  const toggleFaces = () => {
    setShowFaces(!showFaces);
  };

  // Drawing faces in 2D
  const canvasDrawCallback = useCallback(
    (ctx, globalScale) => {
      if (!showFaces || !graphData.faces || graphType !== "2D") return;

      const graph = graphRef.current;
      if (!graph) return;
      // get positions
      const graphNodes = graph.graphData().nodes;
      const nodePositions = {};
      graphNodes.forEach((node) => {
        nodePositions[node.id] = { x: node.x, y: node.y };
      });

      // actually draw
      ctx.save();
      graphData.faces.forEach((face) => {
        const positions = face.nodes
          .map((nodeId) => nodePositions[nodeId])
          .filter((pos) => pos);

        if (positions.length === 3) {
          ctx.beginPath();
          ctx.moveTo(positions[0].x, positions[0].y);
          ctx.lineTo(positions[1].x, positions[1].y);
          ctx.lineTo(positions[2].x, positions[2].y);
          ctx.closePath();

          // fill
          ctx.fillStyle =
            graphConfig.faceFillColor || "rgba(100, 150, 250, 0.2)";
          ctx.fill();
          // edge stroke
          ctx.strokeStyle =
            graphConfig.faceStrokeColor || "rgba(100, 150, 250, 0.5)";
          ctx.lineWidth = graphConfig.faceStrokeWidth || 1;
          ctx.stroke();
        }
      });
      ctx.restore();
    },
    [showFaces, graphData.faces, graphType, graphConfig],
  );

  // setup for 3D faces
  const sceneSetup = useCallback(
    (scene) => {
      if (!showFaces || !graphData.faces || graphType !== "3D") return;

      const graph = graphRef.current;
      if (!graph) return;

      // remove existing face meshes
      const toRemove = [];
      scene.children.forEach((child) => {
        if (child.userData && child.userData.isFace) {
          toRemove.push(child);
        }
      });
      toRemove.forEach((child) => scene.remove(child));

      // THREE.js and materials
      const THREE = window.THREE;
      const material = new THREE.MeshBasicMaterial({
        color: graphConfig.faceFillColor || 0x6496fa,
        opacity: graphConfig.faceOpacity || 0.3,
        transparent: true,
        side: THREE.DoubleSide,
      });

      // get positions
      const graphNodes = graph.graphData().nodes;
      const nodePositions = {};
      graphNodes.forEach((node) => {
        nodePositions[node.id] = new THREE.Vector3(
          node.x || 0,
          node.y || 0,
          node.z || 0,
        );
      });

      // create meshes
      graphData.faces.forEach((face, index) => {
        const positions = face.nodes
          .map((nodeId) => nodePositions[nodeId])
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
        }
      });
    },
    [showFaces, graphData.faces, graphType, graphConfig],
  );

  const ForceGraphComponent = graphType === "3D" ? ForceGraph3D : ForceGraph2D;

  const mergedConfig = {
    ...graphConfig,
    ...(graphType === "2D"
      ? {
          onRenderFramePost: canvasDrawCallback,
        }
      : {
          onEngineStop: () => {
            if (graphRef.current && graphRef.current.scene) {
              sceneSetup(graphRef.current.scene());
            }
          },
        }),
  };

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
              {showFaces ? "Hide" : "Show"} Faces
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
            {...mergedConfig}
          />
        )}
      </div>
    </div>
  );
}

export default App;

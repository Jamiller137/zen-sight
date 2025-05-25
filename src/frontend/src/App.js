import React, { useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import axios from "axios";
import "./App.css";

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/graph-data");
      setGraphData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      setLoading(false);
    }
  };

  const handleDataUpload = async (data) => {
    try {
      const response = await axios.post("/api/process", data);
      setGraphData(response.data);
    } catch (error) {
      console.error("Error processing data:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Force Graph Visualization</h1>
      </header>
      <div className="graph-container">
        {loading ? (
          <p>Loading graph data...</p>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel="name"
            nodeAutoColorBy="group"
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.01}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.name || node.id;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "black";
              ctx.fillText(label, node.x, node.y);
            }}
            width={800}
            height={600}
          />
        )}
      </div>
    </div>
  );
}

export default App;

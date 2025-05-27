import { useState, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import ForceGraph3D from "react-force-graph-3d";
import axios from "axios";
import "./App.css";

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [graphConfig, setGraphConfig] = useState({});
  const [graphType, setGraphType] = useState("3D");
  const [loading, setLoading] = useState(true);

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

  const ForceGraphComponent = graphType === "3D" ? ForceGraph3D : ForceGraph2D;

  return (
    <div className="App">
      <header className="App-header">
        <h1>Zen Sight</h1>
        <button onClick={toggleGraphType} className="toggle-button">
          Switch to {graphType === "3D" ? "2D" : "3D"}
        </button>
      </header>
      <div className="graph-container">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ForceGraphComponent graphData={graphData} {...graphConfig} />
        )}
      </div>
    </div>
  );
}

export default App;

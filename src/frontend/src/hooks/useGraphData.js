import { useState, useEffect, useCallback, useRef } from "react";
import { graphAPI } from "../services/api";

export const useGraphData = () => {
  const [graphData, setGraphData] = useState({
    nodes: [],
    links: [],
    faces: [],
  });
  const [graphConfig, setGraphConfig] = useState({});
  const [metadata, setMetadata] = useState({});
  const [graphType, setGraphType] = useState("3D");
  const [loading, setLoading] = useState(true);
  const [showFaces, setShowFaces] = useState(true);
  const [forceGraphKey, setForceGraphKey] = useState(0);

  const fetchGraphData = useCallback(async () => {
    try {
      const response = await graphAPI.getGraphData();
      const {
        graphType: type,
        data,
        config,
        metadata: responseMetadata,
      } = response.data;

      setGraphType(type);
      setGraphData(data);
      setGraphConfig(config);
      setMetadata(responseMetadata || {});
      setLoading(false);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      setLoading(false);
    }
  }, []);

  const toggleGraphType = useCallback(() => {
    const newType = graphType === "3D" ? "2D" : "3D";
    setGraphType(newType);
    setForceGraphKey((prev) => prev + 1);
  }, [graphType]);

  const toggleFaces = useCallback(() => {
    setShowFaces((prev) => !prev);
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  return {
    graphData,
    setGraphData,
    graphConfig,
    metadata,
    graphType,
    loading,
    showFaces,
    forceGraphKey,
    setForceGraphKey,
    toggleGraphType,
    toggleFaces,
    fetchGraphData,
  };
};

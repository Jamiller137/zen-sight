import React, { useState, useMemo } from "react";
import "./MetadataPanel.css";

const DataPointModal = ({ isOpen, onClose, nodeId, dataPoints }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Data Points for {nodeId}</h3>
          <button
            onClick={onClose}
            className="btn btn--close"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>Total points: {dataPoints.length}</p>
          <div className="data-points-container">
            <pre>{JSON.stringify(dataPoints, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetadataPanel = ({
  graphData,
  metadata,
  selectedNodes,
  isVisible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [modalState, setModalState] = useState({
    isOpen: false,
    nodeId: null,
    dataPoints: [],
  });

  const selectedNodeData = useMemo(() => {
    if (!selectedNodes?.size || !graphData?.nodes) return null;

    const selectedNodeIds = Array.from(selectedNodes);
    const foundNodes = selectedNodeIds
      .map((nodeId) => graphData.nodes.find((n) => n.id === nodeId))
      .filter(Boolean);

    return foundNodes.length > 0 ? foundNodes : null;
  }, [selectedNodes, graphData?.nodes]);

  const intersectionData = useMemo(() => {
    if (!selectedNodeData || selectedNodeData.length <= 1) return null;

    const allDataPointSets = selectedNodeData
      .map((node) => node.originalDataPoints || [])
      .filter((points) => points.length > 0);

    if (allDataPointSets.length < 2) return null;

    let intersection = allDataPointSets[0];
    for (let i = 1; i < allDataPointSets.length; i++) {
      intersection = intersection.filter((point1) =>
        allDataPointSets[i].some(
          (point2) => JSON.stringify(point1) === JSON.stringify(point2)
        )
      );
    }

    return {
      intersectionPoints: intersection,
      totalUnique: new Set(
        allDataPointSets.flat().map((point) => JSON.stringify(point))
      ).size,
      individualCounts: allDataPointSets.map((points) => points.length),
    };
  }, [selectedNodeData]);

  const clusterStats = useMemo(() => {
    if (!graphData?.nodes?.length) return null;

    const clusterSizes = graphData.nodes.map((node) => node.clusterSize || 0);
    const totalSize = clusterSizes.reduce((sum, size) => sum + size, 0);

    return {
      average: (totalSize / graphData.nodes.length).toFixed(1),
      maximum: Math.max(...clusterSizes),
      minimum: Math.min(...clusterSizes),
      total: totalSize,
    };
  }, [graphData?.nodes]);

  // Helper function to format statistical values
  const formatStatValue = (value) => {
    if (value === null || value === undefined) return "N/A";

    // Handle string values from str(np.mean())
    if (typeof value === "string") {
      // Try to parse as array first (for numpy array string representations)
      if (value.startsWith("[") && value.endsWith("]")) {
        try {
          const parsed = JSON.parse(
            value.replace(/\s+/g, ",").replace(/,+/g, ",")
          );
          if (Array.isArray(parsed)) {
            return `[${parsed.map((v) => parseFloat(v).toFixed(4)).join(", ")}]`;
          }
        } catch (e) {
          // If JSON parsing fails, try to parse the numpy array format
          const cleanValue = value.replace(/[\[\]]/g, "").trim();
          const numbers = cleanValue
            .split(/\s+/)
            .map((s) => parseFloat(s))
            .filter((n) => !isNaN(n));
          if (numbers.length > 0) {
            return `[${numbers.map((v) => v.toFixed(4)).join(", ")}]`;
          }
        }
      }

      // Handle single number as string
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed.toFixed(4);
    }

    // Handle numeric values
    if (typeof value === "number") {
      return value.toFixed(4);
    }

    // Handle arrays (legacy)
    if (Array.isArray(value)) {
      return `[${value.map((v) => parseFloat(v).toFixed(4)).join(", ")}]`;
    }

    return String(value);
  };

  const openDataPointModal = (nodeId, dataPoints) => {
    setModalState({ isOpen: true, nodeId, dataPoints });
  };

  const closeDataPointModal = () => {
    setModalState({ isOpen: false, nodeId: null, dataPoints: [] });
  };

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  if (!isVisible) return null;

  const renderSingleNodeDetails = (node) => (
    <div className="single-node-details">
      <h5>
        <button
          className="btn btn--link"
          onClick={() =>
            openDataPointModal(node.id, node.originalDataPoints || [])
          }
        >
          Node: {node.id}
        </button>
      </h5>

      <div className="metadata-grid">
        <div className="metadata-item">
          <span className="metadata-label">Cluster Size:</span>
          <span className="metadata-value">{node.clusterSize || 0}</span>
        </div>
        {node.group !== undefined && (
          <div className="metadata-item">
            <span className="metadata-label">Group:</span>
            <span className="metadata-value">{node.group}</span>
          </div>
        )}
        {node.color && (
          <div className="metadata-item">
            <span className="metadata-label">Color:</span>
            <span className="metadata-value">
              {node.color}
              <span
                className="node-color-indicator"
                style={{ backgroundColor: node.color }}
              />
            </span>
          </div>
        )}
      </div>

      {/* Debug Information */}
      {node.debug && (
        <div className="metadata-subsection">
          <h5>Debug Info</h5>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Cluster Indices Count:</span>
              <span className="metadata-value">
                {node.debug.clusterIndicesCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {(node.stats?.projectionMean !== undefined ||
        node.stats?.projectionMeanOverall !== undefined) && (
          <div className="metadata-subsection">
            <h5>Projection Statistics</h5>
            <div className="metadata-grid">
              {node.stats.projectionMean !== undefined && (
                <div className="metadata-item">
                  <span className="metadata-label">
                    Projection Mean (per dim):
                  </span>
                  <span className="metadata-value metadata-array">
                    {formatStatValue(node.stats.projectionMean)}
                  </span>
                </div>
              )}
              {node.stats.projectionStd !== undefined && (
                <div className="metadata-item">
                  <span className="metadata-label">Projection Std (per dim):</span>
                  <span className="metadata-value metadata-array">
                    {formatStatValue(node.stats.projectionStd)}
                  </span>
                </div>
              )}
              {node.stats.projectionMeanOverall !== undefined && (
                <div className="metadata-item">
                  <span className="metadata-label">
                    Projection Mean (overall):
                  </span>
                  <span className="metadata-value">
                    {formatStatValue(node.stats.projectionMeanOverall)}
                  </span>
                </div>
              )}
              {node.stats.projectionStdOverall !== undefined && (
                <div className="metadata-item">
                  <span className="metadata-label">
                    Projection Std (overall):
                  </span>
                  <span className="metadata-value">
                    {formatStatValue(node.stats.projectionStdOverall)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {node.stats?.mean !== undefined && (
        <div className="metadata-subsection">
          <h5>Data Statistics</h5>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Mean:</span>
              <span className="metadata-value metadata-array">
                {formatStatValue(node.stats.mean)}
              </span>
            </div>
            {node.stats.std !== undefined && (
              <div className="metadata-item">
                <span className="metadata-label">Std:</span>
                <span className="metadata-value metadata-array">
                  {formatStatValue(node.stats.std)}
                </span>
              </div>
            )}
            {node.stats.min !== undefined && (
              <div className="metadata-item">
                <span className="metadata-label">Min:</span>
                <span className="metadata-value metadata-array">
                  {formatStatValue(node.stats.min)}
                </span>
              </div>
            )}
            {node.stats.max !== undefined && (
              <div className="metadata-item">
                <span className="metadata-label">Max:</span>
                <span className="metadata-value metadata-array">
                  {formatStatValue(node.stats.max)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {node.originalDataPoints && Array.isArray(node.originalDataPoints) && (
        <div className="metadata-subsection">
          <h5>
            <button
              className="btn btn--link"
              onClick={() =>
                openDataPointModal(node.id, node.originalDataPoints)
              }
            >
              Data Points ({node.originalDataPoints.length}) - Click to view
              all
            </button>
          </h5>
          <div className="metadata-code">
            <pre>
              {JSON.stringify(node.originalDataPoints.slice(0, 3), null, 2)}
              {node.originalDataPoints.length > 3 &&
                `\n... and ${node.originalDataPoints.length - 3
                } more`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );

  const renderMultipleNodesDetails = () => {
    const totalClusterSize = selectedNodeData.reduce(
      (sum, node) => sum + (node.clusterSize || 0),
      0
    );

    return (
      <div className="multiple-nodes-details">
        <div className="metadata-grid">
          <div className="metadata-item">
            <span className="metadata-label">Total Cluster Size:</span>
            <span className="metadata-value">{totalClusterSize}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Avg Cluster Size:</span>
            <span className="metadata-value">
              {(totalClusterSize / selectedNodeData.length).toFixed(1)}
            </span>
          </div>
        </div>

        {intersectionData && (
          <div className="metadata-subsection">
            <h5>Data Point Intersection</h5>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">Shared Points:</span>
                <span className="metadata-value">
                  {intersectionData.intersectionPoints.length}
                </span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Total Unique:</span>
                <span className="metadata-value">
                  {intersectionData.totalUnique}
                </span>
              </div>
            </div>

            {intersectionData.intersectionPoints.length > 0 && (
              <div className="metadata-subsection">
                <button
                  className="btn btn--link"
                  onClick={() =>
                    openDataPointModal(
                      `Intersection of ${selectedNodeData
                        .map((n) => n.id)
                        .join(", ")}`,
                      intersectionData.intersectionPoints
                    )
                  }
                >
                  View Shared Data Points (
                  {intersectionData.intersectionPoints.length})
                </button>
                <div className="metadata-code">
                  <pre>
                    {JSON.stringify(
                      intersectionData.intersectionPoints.slice(0, 2),
                      null,
                      2
                    )}
                    {intersectionData.intersectionPoints.length > 2 &&
                      `\n... and ${intersectionData.intersectionPoints.length - 2
                      } more shared points`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="metadata-subsection">
          <h5>Individual Nodes</h5>
          <div className="metadata-list">
            {selectedNodeData.map((node) => (
              <div key={node.id} className="metadata-list-item">
                <button
                  className="btn btn--link"
                  onClick={() =>
                    openDataPointModal(node.id, node.originalDataPoints || [])
                  }
                >
                  <span className="metadata-label">Node {node.id}:</span>
                  <span className="metadata-value">
                    {node.clusterSize || 0} points
                    {node.color && (
                      <span
                        className="node-color-indicator"
                        style={{ backgroundColor: node.color }}
                      />
                    )}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={`metadata-panel ${isExpanded ? "expanded" : "collapsed"}`}
      >
        <div className="metadata-header">
          <h3>Metadata</h3>
          <button
            onClick={toggleExpanded}
            className="btn btn--panel-toggle"
            aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
          >
            {isExpanded ? "→" : "←"}
          </button>
        </div>

        {isExpanded && (
          <div className="metadata-content">
            {/* Selected Nodes Section */}
            {selectedNodeData && (
              <div className="metadata-section selected-nodes-section">
                <h4>Selected Nodes ({selectedNodeData.length})</h4>
                {selectedNodeData.length === 1
                  ? renderSingleNodeDetails(selectedNodeData[0])
                  : renderMultipleNodesDetails()}
              </div>
            )}

            {/* Selection Status */}
            <div className="metadata-section">
              <h4>Selection Status</h4>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">Selected Nodes:</span>
                  <span className="metadata-value">
                    {selectedNodes?.size || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Dataset Overview */}
            <div className="metadata-section">
              <h4>Dataset Overview</h4>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="metadata-label">Nodes:</span>
                  <span className="metadata-value">
                    {metadata.mapperResult?.totalNodes ||
                      graphData.nodes?.length ||
                      0}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Edges:</span>
                  <span className="metadata-value">
                    {metadata.mapperResult?.nerveComplexity?.edges ||
                      graphData.links?.length ||
                      0}
                  </span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Faces:</span>
                  <span className="metadata-value">
                    {metadata.mapperResult?.nerveComplexity?.faces ||
                      graphData.faces?.length ||
                      0}
                  </span>
                </div>
              </div>
            </div>

            {/* Cluster Statistics */}
            {clusterStats && (
              <div className="metadata-section">
                <h4>Cluster Statistics</h4>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="metadata-label">Avg Cluster Size:</span>
                    <span className="metadata-value">{clusterStats.average}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Max Cluster Size:</span>
                    <span className="metadata-value">{clusterStats.maximum}</span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Min Cluster Size:</span>
                    <span className="metadata-value">{clusterStats.minimum}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Smallest Clusters */}
            {graphData?.nodes?.length > 0 && (
              <div className="metadata-section">
                <h4>Smallest Clusters</h4>
                <div className="metadata-list">
                  {graphData.nodes
                    .sort((a, b) => (a.clusterSize || 0) - (b.clusterSize || 0))
                    .slice(0, 5)
                    .map((node) => (
                      <div key={node.id} className="metadata-list-item">
                        <span className="metadata-label">Node {node.id}:</span>
                        <span className="metadata-value">
                          {node.clusterSize || 0} points
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <DataPointModal
        isOpen={modalState.isOpen}
        onClose={closeDataPointModal}
        nodeId={modalState.nodeId}
        dataPoints={modalState.dataPoints}
      />
    </>
  );
};

export default MetadataPanel;

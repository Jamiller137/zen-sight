import React, { useState, useRef } from "react";
import Header from "./components/header/Header.jsx";
import SelectionToolbar from "./components/selection/SelectionToolbar.jsx";
import GraphContainer from "./components/graph/GraphContainer.jsx";
import Timeline from "./components/timeline/Timeline.jsx";
import StatusBar from "./components/common/StatusBar.jsx";
import MetadataPanel from "./components/metadata/MetadataPanel.jsx";

import { useGraphData } from "./hooks/useGraphData";
import { useSelection } from "./hooks/useSelection";
import { useOperations } from "./hooks/useOperations";
import { useLasso } from "./hooks/useLasso";
import { useGraphOperations } from "./hooks/useGraphOperations";

import "./styles/App.css";

function App() {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [selectedCutColor, setSelectedCutColor] = useState("#ff6969");
  const [selectedDupColor, setSelectedDupColor] = useState("#69ff69");
  const graphRef = useRef();

  const {
    graphData,
    setGraphData,
    graphConfig,
    graphType,
    toggleGraphType,
    loading,
    showFaces,
    toggleFaces,
    forceGraphKey,
    setForceGraphKey,
    metadata,
  } = useGraphData();

  const {
    selectedNodes,
    setSelectedNodes,
    selectionMode,
    setSelectionMode,
    clearSelections,
    handleNodeClick,
  } = useSelection();

  const {
    cutOperations,
    setCutOperations,
    dupOperations,
    setDupOperations,
    setAffectedNodes,
    operationsHistory,
    currentOperationIndex,
    isReplayingOperation,
    saveOperation,
    replayToOperation,
  } = useOperations();

  const {
    isLassoMode,
    lassoPath,
    isDrawing,
    handleOverlayMouseDown,
    handleOverlayMouseMove,
    handleOverlayMouseUp,
  } = useLasso(selectionMode, graphType, graphData, setSelectedNodes, graphRef);

  const { cutSelectedNodes, dupSelectedNodes } = useGraphOperations({
    graphData,
    setGraphData,
    selectedNodes,
    setSelectedNodes,
    setAffectedNodes,
    setCutOperations,
    setDupOperations,
    selectedCutColor,
    selectedDupColor,
  });

  const handleReplayToOperation = async (operationIndex) => {
    try {
      const replayedGraph = await replayToOperation(operationIndex);
      clearSelections();
      setForceGraphKey((prev) => prev + 1);
      setGraphData({
        nodes: [...replayedGraph.nodes],
        links: [...replayedGraph.links],
        faces: [...(replayedGraph.faces || [])],
      });
    } catch (error) {
      console.error("Failed to replay operation:", error);
    }
  };

  const handleCutNodes = async () => {
    const operation = await cutSelectedNodes();
    if (operation) {
      saveOperation(operation.type, operation.description, operation.data);
    }
  };

  const handleDupNodes = async () => {
    const operation = await dupSelectedNodes();
    if (operation) {
      saveOperation(operation.type, operation.description, operation.data);
    }
  };

  return (
    <div className="App">
      <Header
        graphType={graphType}
        graphData={graphData}
        showFaces={showFaces}
        selectionMode={selectionMode}
        showTimeline={showTimeline}
        showMetadata={showMetadata}
        onToggleGraphType={toggleGraphType}
        onToggleFaces={toggleFaces}
        onSelectionModeChange={setSelectionMode}
        onToggleTimeline={() => setShowTimeline(!showTimeline)}
        onToggleMetadata={() => setShowMetadata(!showMetadata)}
      />

      {isLassoMode && <StatusBar message="Click and drag to select nodes" />}

      <SelectionToolbar
        selectedNodes={selectedNodes}
        selectedCutColor={selectedCutColor}
        selectedDupColor={selectedDupColor}
        onCutColorChange={setSelectedCutColor}
        onDupColorChange={setSelectedDupColor}
        onCutNodes={handleCutNodes}
        onDupNodes={handleDupNodes}
        onClearSelections={clearSelections}
      />

      <div className="main-content">
        {showTimeline && (
          <Timeline
            operationsHistory={operationsHistory}
            currentOperationIndex={currentOperationIndex}
            isReplayingOperation={isReplayingOperation}
            onReplayToOperation={handleReplayToOperation}
          />
        )}

        <GraphContainer
          ref={graphRef}
          graphData={graphData}
          graphConfig={graphConfig}
          graphType={graphType}
          loading={loading}
          showFaces={showFaces}
          selectedNodes={selectedNodes}
          cutOperations={cutOperations}
          dupOperations={dupOperations}
          isLassoMode={isLassoMode}
          lassoPath={lassoPath}
          isDrawing={isDrawing}
          forceGraphKey={forceGraphKey}
          isReplayingOperation={isReplayingOperation}
          onNodeClick={handleNodeClick}
          onLassoMouseDown={handleOverlayMouseDown}
          onLassoMouseMove={handleOverlayMouseMove}
          onLassoMouseUp={handleOverlayMouseUp}
        />
      </div>

      <MetadataPanel
        graphData={graphData}
        metadata={metadata || {}}
        selectedNodes={selectedNodes}
        isVisible={showMetadata}
      />
    </div>
  );
}

export default App;

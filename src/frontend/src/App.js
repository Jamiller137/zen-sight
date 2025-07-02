import React, { useState, useRef } from "react";
import Header from "./components/header/Header";
import SelectionToolbar from "./components/selection/SelectionToolbar";
import GraphContainer from "./components/graph/GraphContainer";
import Timeline from "./components/timeline/Timeline";
import StatusBar from "./components/common/StatusBar";

import { useGraphData } from "./hooks/useGraphData";
import { useSelection } from "./hooks/useSelection";
import { useOperations } from "./hooks/useOperations";
import { useLasso } from "./hooks/useLasso";
import { useGraphOperations } from "./hooks/useGraphOperations";

import "./styles/App.css";

function App() {
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedCutColor, setSelectedCutColor] = useState("#ff6969");
  const [selectedSplitColor, setSelectedSplitColor] = useState("#69ff69");

  const graphRef = useRef();

  const {
    graphData,
    setGraphData,
    graphConfig,
    graphType,
    loading,
    showFaces,
    forceGraphKey,
    setForceGraphKey,
    toggleGraphType,
    toggleFaces,
  } = useGraphData();

  const {
    selectedNodes,
    selectedFaces,
    selectionMode,
    setSelectionMode,
    clearSelections,
    handleNodeClick,
    handleFaceClick,
    setSelectedNodes,
    setSelectedFaces,
  } = useSelection();

  const {
    cutOperations,
    setCutOperations,
    splitOperations,
    setSplitOperations,
    affectedNodes,
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
    handleLassoSelection,
    handleOverlayMouseDown,
    handleOverlayMouseMove,
    handleOverlayMouseUp,
  } = useLasso(selectionMode, graphType, graphData, setSelectedNodes, graphRef);

  const { cutSelectedNodes, splitSelectedNodes } = useGraphOperations(
    graphData,
    setGraphData,
    selectedNodes,
    setSelectedNodes,
    setSelectedFaces,
    setAffectedNodes,
    setCutOperations,
    setSplitOperations,
    saveOperation,
    selectedCutColor,
    selectedSplitColor,
  );

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

  return (
    <div className="App">
      <Header
        graphType={graphType}
        graphData={graphData}
        showFaces={showFaces}
        selectionMode={selectionMode}
        showTimeline={showTimeline}
        onToggleGraphType={toggleGraphType}
        onToggleFaces={toggleFaces}
        onSelectionModeChange={setSelectionMode}
        onToggleTimeline={() => setShowTimeline(!showTimeline)}
      />

      {isLassoMode && <StatusBar message="Click and drag to select nodes" />}

      <SelectionToolbar
        selectedNodes={selectedNodes}
        selectedFaces={selectedFaces}
        selectedCutColor={selectedCutColor}
        selectedSplitColor={selectedSplitColor}
        onCutColorChange={setSelectedCutColor}
        onSplitColorChange={setSelectedSplitColor}
        onCutNodes={cutSelectedNodes}
        onSplitNodes={splitSelectedNodes}
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
          selectedFaces={selectedFaces}
          cutOperations={cutOperations}
          splitOperations={splitOperations}
          isLassoMode={isLassoMode}
          lassoPath={lassoPath}
          isDrawing={isDrawing}
          forceGraphKey={forceGraphKey}
          isReplayingOperation={isReplayingOperation}
          onNodeClick={handleNodeClick}
          onFaceClick={handleFaceClick}
          onLassoMouseDown={handleOverlayMouseDown}
          onLassoMouseMove={handleOverlayMouseMove}
          onLassoMouseUp={handleOverlayMouseUp}
        />
      </div>
    </div>
  );
}

export default App;

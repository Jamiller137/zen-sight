import React from "react";
import ViewControls from "./ViewControls";
import "./Header.js";

const Header = ({
  graphType,
  graphData,
  showFaces,
  selectionMode,
  showTimeline,
  onToggleGraphType,
  onToggleFaces,
  onSelectionModeChange,
  onToggleTimeline,
}) => {
  return (
    <header className="App-header">
      <div className="header-left">
        <h1>Zen Sight</h1>
      </div>

      <div className="header-center">
        <ViewControls
          graphType={graphType}
          graphData={graphData}
          showFaces={showFaces}
          selectionMode={selectionMode}
          onToggleGraphType={onToggleGraphType}
          onToggleFaces={onToggleFaces}
          onSelectionModeChange={onSelectionModeChange}
        />
      </div>

      <div className="header-right">
        <button onClick={onToggleTimeline} className="btn btn--default">
          Timeline
        </button>
      </div>
    </header>
  );
};

export default Header;

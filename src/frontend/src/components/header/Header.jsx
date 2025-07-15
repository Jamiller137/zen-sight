import React from "react";
import ViewControls from "./ViewControls.jsx";
import "./Header.css";

const Header = ({
  graphType,
  graphData,
  showFaces,
  selectionMode,
  showTimeline,
  showMetadata,
  onToggleGraphType,
  onToggleFaces,
  onSelectionModeChange,
  onToggleTimeline,
  onToggleMetadata,
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
          {showTimeline ? "Hide" : "Show"} Timeline
        </button>
        <button onClick={onToggleMetadata} className="btn btn--default">
          {showMetadata ? "Hide" : "Show"} Metadata
        </button>
      </div>
    </header>
  );
};

export default Header;

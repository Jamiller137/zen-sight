import React from "react";
import { getAvailableSelectionModes } from "../../utils/selectionUtils";

const ViewControls = ({
  graphType,
  graphData,
  showFaces,
  selectionMode,
  onToggleGraphType,
  onToggleFaces,
  onSelectionModeChange,
}) => {
  return (
    <div className="view-controls">
      <button onClick={onToggleGraphType} className="btn btn--default">
        {graphType === "3D" ? "2D" : "3D"}
      </button>

      {graphData.faces?.length > 0 && (
        <button onClick={onToggleFaces} className="btn btn--default">
          {showFaces ? "Hide" : "Show"} Faces ({graphData.faces.length})
        </button>
      )}

      <select
        value={selectionMode}
        onChange={(e) => onSelectionModeChange(e.target.value)}
        className="selection-mode"
      >
        {getAvailableSelectionModes(graphType).map((mode) => (
          <option key={mode.value} value={mode.value}>
            {mode.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ViewControls;

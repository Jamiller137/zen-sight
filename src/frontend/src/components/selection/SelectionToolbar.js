import React from "react";
import ActionControls from "./ActionControls";
import "./SelectionToolbar.css";

const SelectionToolbar = ({
  selectedNodes,
  selectedCutColor,
  selectedDupColor,
  onCutColorChange,
  onDupColorChange,
  onCutNodes,
  onDupNodes,
  onClearSelections,
}) => {
  if (selectedNodes.size === 0) {
    return null;
  }

  return (
    <div className="selection-toolbar">
      <div className="selection-info">
        {selectedNodes.size > 0 && <span>{selectedNodes.size} nodes</span>}
      </div>

      {selectedNodes.size > 0 && (
        <ActionControls
          selectedNodes={selectedNodes}
          selectedCutColor={selectedCutColor}
          selectedDupColor={selectedDupColor}
          onCutColorChange={onCutColorChange}
          onDupColorChange={onDupColorChange}
          onCutNodes={onCutNodes}
          onDupNodes={onDupNodes}
          onClearSelections={onClearSelections}
        />
      )}
    </div>
  );
};

export default SelectionToolbar;

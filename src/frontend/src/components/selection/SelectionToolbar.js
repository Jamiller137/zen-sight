import React from "react";
import ActionControls from "./ActionControls";
import "./SelectionToolbar.css";

const SelectionToolbar = ({
  selectedNodes,
  selectedFaces,
  selectedCutColor,
  selectedSplitColor,
  onCutColorChange,
  onSplitColorChange,
  onCutNodes,
  onSplitNodes,
  onClearSelections,
}) => {
  if (selectedNodes.size === 0 && selectedFaces.size === 0) {
    return null;
  }

  return (
    <div className="selection-toolbar">
      <div className="selection-info">
        {selectedNodes.size > 0 && <span>{selectedNodes.size} nodes</span>}
        {selectedFaces.size > 0 && <span>{selectedFaces.size} faces</span>}
      </div>

      {selectedNodes.size > 0 && (
        <ActionControls
          selectedNodes={selectedNodes}
          selectedCutColor={selectedCutColor}
          selectedSplitColor={selectedSplitColor}
          onCutColorChange={onCutColorChange}
          onSplitColorChange={onSplitColorChange}
          onCutNodes={onCutNodes}
          onSplitNodes={onSplitNodes}
          onClearSelections={onClearSelections}
        />
      )}
    </div>
  );
};

export default SelectionToolbar;

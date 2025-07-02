import React from "react";
import ColorPicker from "./ColorPicker";
import { PREDEFINED_COLORS } from "../../utils/constants";

const ActionControls = ({
  selectedNodes,
  selectedCutColor,
  selectedSplitColor,
  onCutColorChange,
  onSplitColorChange,
  onCutNodes,
  onSplitNodes,
  onClearSelections,
}) => {
  return (
    <div className="action-controls">
      <div className="color-group">
        <label>Cut:</label>
        <ColorPicker
          selectedColor={selectedCutColor}
          predefinedColors={PREDEFINED_COLORS}
          onColorChange={onCutColorChange}
        />
        <button onClick={onCutNodes} className="btn btn--danger">
          Cut ({selectedNodes.size})
        </button>
      </div>

      <div className="color-group">
        <label>Split:</label>
        <ColorPicker
          selectedColor={selectedSplitColor}
          predefinedColors={PREDEFINED_COLORS}
          onColorChange={onSplitColorChange}
        />
        <button onClick={onSplitNodes} className="btn btn--warning">
          Split ({selectedNodes.size})
        </button>
      </div>

      <button onClick={onClearSelections} className="btn btn--default">
        Clear
      </button>
    </div>
  );
};

export default ActionControls;

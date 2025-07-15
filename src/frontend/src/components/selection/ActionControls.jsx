import React from "react";
import ColorPicker from "./ColorPicker.jsx";
import { PREDEFINED_COLORS } from "../../utils/constants";

const ActionControls = ({
  selectedNodes,
  selectedCutColor,
  selectedDupColor,
  onCutColorChange,
  onDupColorChange,
  onCutNodes,
  onDupNodes,
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
        <label>Duplicate:</label>
        <ColorPicker
          selectedColor={selectedDupColor}
          predefinedColors={PREDEFINED_COLORS}
          onColorChange={onDupColorChange}
        />
        <button onClick={onDupNodes} className="btn btn--warning">
          Duplicate ({selectedNodes.size})
        </button>
      </div>

      <button onClick={onClearSelections} className="btn btn--default">
        Clear
      </button>
    </div>
  );
};

export default ActionControls;

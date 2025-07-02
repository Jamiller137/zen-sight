import React from "react";
import "./ColorPicker.css";

const ColorPicker = ({ selectedColor, predefinedColors, onColorChange }) => {
  return (
    <>
      <input
        type="color"
        value={selectedColor}
        onChange={(e) => onColorChange(e.target.value)}
        className="color-picker"
      />
      <div className="predefined-colors">
        {predefinedColors.map((color) => (
          <button
            key={color}
            className={`color-button ${selectedColor === color ? "active" : ""}`}
            style={{ backgroundColor: color }}
            onClick={() => onColorChange(color)}
            title={color}
          />
        ))}
      </div>
    </>
  );
};

export default ColorPicker;

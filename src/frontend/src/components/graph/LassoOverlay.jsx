import React from "react";
import "./LassoOverlay.css";

const LassoOverlay = ({
  lassoPath,
  isDrawing,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) => {
  return (
    <div
      className="lasso-overlay"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <svg className="lasso-svg">
        {lassoPath.length > 1 && (
          <path
            d={`M ${lassoPath[0].x} ${lassoPath[0].y} ${lassoPath
              .slice(1)
              .map((p) => `L ${p.x} ${p.y}`)
              .join(" ")}${!isDrawing && lassoPath.length > 2 ? " Z" : ""}`}
            stroke="#ff6969"
            strokeWidth="2"
            strokeDasharray="5,5"
            fill="rgba(255, 105, 105, 0.1)"
            fillRule="evenodd"
          />
        )}
      </svg>
    </div>
  );
};

export default LassoOverlay;

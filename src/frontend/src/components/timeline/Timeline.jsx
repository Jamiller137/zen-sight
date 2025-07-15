import React from "react";
import "./Timeline.css";

const Timeline = ({
  operationsHistory,
  currentOperationIndex,
  isReplayingOperation,
  onReplayToOperation,
}) => {
  return (
    <div className="timeline-sidebar">
      <div className="sidebar-header">
        <h3>Timeline</h3>
        <small>Grandfather Paradox Applies</small>
      </div>
      <div className="timeline-list">
        {operationsHistory.map((operation, index) => (
          <div
            key={operation.id}
            className={`timeline-item ${
              index === currentOperationIndex ? "active" : ""
            }`}
            style={{ opacity: isReplayingOperation ? 0.6 : 1 }}
            onClick={() => !isReplayingOperation && onReplayToOperation(index)}
          >
            <div className="timeline-content">
              <div className="timeline-description">
                {operation.description}
              </div>
              <div className="timeline-meta">
                <span className="timeline-type">{operation.type}</span>
                <span className="timeline-time">
                  {new Date(operation.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;

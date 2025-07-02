import React from "react";
import "./StatusBar.css";

const StatusBar = ({ message, type = "info" }) => {
  return (
    <div className={`status-bar status-bar--${type}`}>
      <div className="status-message">{message}</div>
    </div>
  );
};

export default StatusBar;

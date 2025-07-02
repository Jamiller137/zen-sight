export const getAvailableSelectionModes = (graphType) => {
  if (graphType === "2D") {
    return [
      { value: "single", label: "Single Select" },
      { value: "multi", label: "Multi Select" },
      { value: "none", label: "No Selection" },
    ];
  } else {
    return [
      { value: "single", label: "Single Select" },
      { value: "multi", label: "Multi Select" },
      { value: "lasso", label: "Lasso Select" },
      { value: "none", label: "No Selection" },
    ];
  }
};

export const isPointInPolygon = (point, polygon) => {
  if (polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      polygon[i].y > point.y !== polygon[j].y > point.y &&
      point.x <
        ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) /
          (polygon[j].y - polygon[i].y) +
          polygon[i].x
    ) {
      inside = !inside;
    }
  }
  return inside;
};

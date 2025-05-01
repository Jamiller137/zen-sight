class EditService {
  static async editNode(nodeIds, action) {
    const response = await fetch("/api/edit/node", {
      method: "POST",
      headers: {
        "Content-Type": "applicaton/json",
      },
      body: JSON.stringify({ nodeIds, action }),
    });
    return response.json();
  }

  static async editEdge(nodeIds, action) {
    const response = await fetch("/api/edit/edge", {
      method: "POST",
      headers: {
        "Content-Type": "applicaton/json",
      },
      body: JSON.stringify({ nodeIds, action }),
    });
    return response.json();
  }

  static async editFace(nodeIds, action) {
    const response = await fetch("/api/edit/face", {
      method: "POST",
      headers: {
        "Content-Type": "applicaton/json",
      },
      body: JSON.stringify({ nodeIds, action }),
    });
    return response.json();
  }

  static determineAction(nodeIds, dimension) {
    // placeholder
    return "add"; //default to add
  }
}

export default EditService;

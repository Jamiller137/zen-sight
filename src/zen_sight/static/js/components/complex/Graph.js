const THREE = window.THREE || {};
import Materials from "./Materials.js";

class Graph {
  constructor(container) {
    this.container = container;
    this.graph = null;
  }

  initialize() {
    this.graph = ForceGraph3D()(this.container)
      .backgroundColor("#f0f0f0")
      .nodeThreeObject((node) => {
        // Get node size from data or use default
        const size = node.data?.size || 5;

        let geometry;
        const shape = node.data?.shape || "sphere";

        switch (shape.toLowerCase()) {
          case "box":
            geometry = new THREE.BoxGeometry(size, size, size);
            break;
          case "cylinder":
            geometry = new THREE.CylinderGeometry(size / 2, size / 2, size, 16);
            break;
          case "sphere":
          default:
            geometry = new THREE.SphereGeometry(size / 2, 16, 16);
            break;
        }

        // Create material
        const material = Materials.createVertexMaterial(node.data);

        return new THREE.Mesh(geometry, material);
      })
      .linkThreeObject((link) => {
        // Create geometry
        const geometry = new THREE.BufferGeometry();

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(6), 3),
        );

        const material = Materials.createEdgeMaterial(link.data);

        // Set width if specified
        if (link.data?.width !== undefined) {
          material.linewidth = link.data.width;
        }

        // Create line mesh
        const line = new THREE.Line(geometry, material);

        // Handle dashed lines
        if (material.isDashed) {
          line.computeLineDistances();
        }

        return line;
      })
      .linkPositionUpdate((obj, { start, end }) => {
        // Update link positions during animation
        const positions = obj.geometry.attributes.position;

        positions.array[0] = start.x;
        positions.array[1] = start.y;
        positions.array[2] = start.z;
        positions.array[3] = end.x;
        positions.array[4] = end.y;
        positions.array[5] = end.z;

        positions.needsUpdate = true;

        // Update line distances
        if (obj.computeLineDistances) {
          obj.computeLineDistances();
        }

        return obj;
      });

    // Store the scene for access by other components
    this.scene = this.graph.scene();

    return this;
  }

  getScene() {
    if (!this.scene && this.graph) {
      this.scene = this.graph.scene();
    }
    return this.scene;
  }

  setData(graphData) {
    this.graph.graphData(graphData);
    return this;
  }

  getNodePosition(nodeId) {
    if (!this.graph) return null;

    // ForceGraph3D stores positions in its internal data.nodes
    const graphData = this.graph.graphData();
    const node = graphData.nodes.find((n) => n.id === nodeId);

    if (!node) return null;

    // Return a copy of the position
    return {
      x: node.x || 0,
      y: node.y || 0,
      z: node.z || 0,
    };
  }
}

export default Graph;

import Materials from "./Materials.js";

class Tetrahedra {
  constructor(graphComponent) {
    this.graphComponent = graphComponent;
    this.scene = graphComponent.scene;
    this.tetrahedraData = [];
    this.meshes = [];
    this.initialized = false;

    this.needsUpdate = false;
    this._isFirstRender = true;

    this.initialize();
  }

  initialize() {
    console.log("[Tetrahedra] Initialized with scene:", !!this.scene);
    this.initialized = true;
    return this;
  }

  setData(data) {
    this.tetrahedraData = data.tetrahedra || [];
    console.log(
      "[Tetrahedra] Setting data with",
      this.tetrahedraData.length,
      "tetrahedra",
    );

    this.needsUpdate = true;
    return this;
  }

  update() {
    // update when necessary
    if (
      (this.needsUpdate || this._isFirstRender) &&
      this.initialized &&
      this.scene
    ) {
      console.log("[Tetrahedra] Updating tetrahedra rendering");
      this._renderTetrahedra();
      this.needsUpdate = false;
      this._isFirstRender = false;
    }

    this._updatePositions();
  }

  _updatePositions() {
    // If no scene or no meshes, exit
    if (!this.scene || !this.meshes || this.meshes.length === 0) return;

    // Get current node positions from the graph
    const nodes = this.graphComponent.graph.graphData().nodes;
    const nodePositions = {};

    // position lookup
    nodes.forEach((node) => {
      if (!isNaN(node.x) && !isNaN(node.y) && !isNaN(node.z)) {
        nodePositions[node.id] = { x: node.x, y: node.y, z: node.z };
      }
    });

    // Update each tetrahedron's vertices based on current node positions
    for (let i = 0; i < this.meshes.length; i++) {
      const mesh = this.meshes[i];
      const tetra = this.tetrahedraData[i];

      if (!mesh || !tetra || !tetra.vertices) continue;

      let allVerticesValid = true;
      const vertexPositions = [];

      for (const id of tetra.vertices) {
        const pos = nodePositions[id];
        if (!pos) {
          allVerticesValid = false;
          break;
        }
        vertexPositions.push(pos);
      }

      if (!allVerticesValid || vertexPositions.length < 4) continue;

      // Update geometry positions
      const positionAttribute = mesh.geometry.attributes.position;

      // Update vertex positions
      for (let j = 0; j < 4; j++) {
        positionAttribute.setXYZ(
          j,
          vertexPositions[j].x,
          vertexPositions[j].y,
          vertexPositions[j].z,
        );
      }

      positionAttribute.needsUpdate = true;
      mesh.geometry.computeVertexNormals();

      // Find and update edges if they exist
      if (tetra.data?.showEdges) {
        // Remove old edges
        for (let c = 0; c < mesh.children.length; c++) {
          if (mesh.children[c].isLineSegments) {
            const edgeObj = mesh.children[c];
            mesh.remove(edgeObj);

            // Dispose resources
            if (edgeObj.geometry) edgeObj.geometry.dispose();
            if (edgeObj.material) edgeObj.material.dispose();

            c--;
          }
        }

        // Create new edges with updated geometry
        const edgeGeometry = new THREE.EdgesGeometry(mesh.geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0x000000,
          linewidth: 2,
        });
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        mesh.add(edges);
      }
    }
  }

  _renderTetrahedra() {
    // If no scene yet or not initialized, exit
    if (!this.scene || !this.initialized) {
      console.log("[Tetrahedra] Skipping render - not initialized or no scene");
      return;
    }

    // Clean up previously created meshes
    if (this.meshes && this.meshes.length > 0) {
      console.log(
        "[Tetrahedra] Cleaning up",
        this.meshes.length,
        "previous meshes",
      );

      // Handle possible null meshes during cleanup
      for (let i = 0; i < this.meshes.length; i++) {
        const mesh = this.meshes[i];
        if (mesh) {
          // remove from scene
          if (mesh.parent) {
            mesh.parent.remove(mesh);
          } else if (this.scene) {
            this.scene.remove(mesh);
          }

          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => {
                if (mat) mat.dispose();
              });
            } else {
              mesh.material.dispose();
            }
          }
        }
      }
      this.meshes = [];
    }

    if (!this.tetrahedraData || !this.tetrahedraData.length) {
      console.log("[Tetrahedra] No tetrahedra data to render");
      return;
    }

    const nodes = this.graphComponent.graph.graphData().nodes;
    const nodePositions = {};

    // Create position lookup and check for valid positions
    let allPositionsValid = true;
    nodes.forEach((node) => {
      // Skip nodes with invalid positions
      if (isNaN(node.x) || isNaN(node.y) || isNaN(node.z)) {
        allPositionsValid = false;
        return;
      }
      nodePositions[node.id] = { x: node.x, y: node.y, z: node.z };
    });

    // Skip rendering if not all positions are valid yet
    if (!allPositionsValid) {
      console.log("[Tetrahedra] Skipping render - invalid node positions");
      return;
    }

    // Create meshes
    let renderedCount = 0;
    this.tetrahedraData.forEach((tetra, index) => {
      if (tetra.vertices && tetra.vertices.length >= 4) {
        // Map vertex IDs to their current positions
        const vertexPositions = [];
        let allVerticesFound = true;

        for (const id of tetra.vertices) {
          const pos = nodePositions[id];
          if (pos) {
            vertexPositions.push(pos);
          } else {
            allVerticesFound = false;
            break;
          }
        }

        // Skip if any vertices weren't found
        if (!allVerticesFound || vertexPositions.length < 4) {
          console.log(
            `[Tetrahedra] Skipping tetrahedron ${index} - missing vertices`,
          );
          return;
        }

        // Create the tetrahedron geometry
        const geometry = new THREE.BufferGeometry();

        const indices = [
          0,
          1,
          2, // Face 1
          0,
          2,
          3, // Face 2
          0,
          3,
          1, // Face 3
          1,
          3,
          2, // Face 4
        ];

        // Create an array of vertex positions
        const positions = [];
        vertexPositions.forEach((pos) => {
          positions.push(pos.x, pos.y, pos.z);
        });

        // Set the vertices and faces for the geometry
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(positions, 3),
        );
        geometry.setIndex(indices);

        geometry.computeVertexNormals();

        const material = Materials.createTetrahedronMaterial(tetra.data);

        const mesh = new THREE.Mesh(geometry, material);

        // Store reference to the tetrahedron data for position updates
        mesh.userData = { tetraId: tetra.id, vertexIds: tetra.vertices };

        // Add edges if showEdges is true
        if (tetra.data?.showEdges) {
          const edgeGeometry = new THREE.EdgesGeometry(geometry);
          const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 2,
          });
          const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
          mesh.add(edges);
        }

        // Add to scene
        this.scene.add(mesh);
        this.meshes.push(mesh);
        renderedCount++;
        console.log(`[Tetrahedra] Added tetrahedron ${index} to scene`);
      }
    });

    console.log(`[Tetrahedra] Rendered ${renderedCount} tetrahedra`);
  }
}

export default Tetrahedra;

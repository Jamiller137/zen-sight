// Note: Should eventually optimize memory usage but for now works okay especially when faces are batched.
// Should also do the same batching to Tetrahedra

const THREE = window.THREE || {};
import Materials from "./Materials.js";

class Faces {
  constructor(graphComponent) {
    this.graphComponent = graphComponent;
    this.scene = graphComponent.getScene();
    this.batchedMeshes = []; // Array of meshes, one per material
    this.data = null;
    this.faceData = []; // Store original face data for updates
    this.materialGroups = []; // Store faces grouped by material

    console.log("[Faces] Initialized with scene:", !!this.scene);
  }

  setData(data) {
    console.log("[Faces] Setting data with", data?.faces?.length, "faces");
    this.data = data;
    this.faceData = data.faces || [];
    this._renderFaces();
    return this;
  }

  // Update face positions
  update() {
    if (!this.scene || !this.faceData.length || !this.batchedMeshes.length) {
      return this;
    }

    try {
      this.materialGroups.forEach((group, groupIndex) => {
        if (!this.batchedMeshes[groupIndex]) return;

        const positions = [];

        // vertex positions for all faces in group
        group.faces.forEach((faceIndex) => {
          const face = this.faceData[faceIndex];
          if (!face || !face.vertices) return;

          for (let i = 0; i < face.vertices.length; i++) {
            const vertexId = face.vertices[i];
            const position = this.graphComponent.getNodePosition(vertexId);

            if (position) {
              positions.push(position.x, position.y, position.z);
            }
          }
        });

        // Update the geometry
        if (positions.length > 0) {
          const mesh = this.batchedMeshes[groupIndex];
          mesh.geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3),
          );
          mesh.geometry.attributes.position.needsUpdate = true;
          mesh.geometry.computeVertexNormals();
        }
      });
    } catch (e) {
      console.error("[Faces] Error updating faces:", e);
    }

    return this;
  }

  _cleanup() {
    // Remove existing batched meshes
    for (const mesh of this.batchedMeshes) {
      if (this.scene) {
        this.scene.remove(mesh);
      }

      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      if (mesh.material) {
        mesh.material.dispose();
      }
    }

    this.batchedMeshes = [];
    this.materialGroups = [];
  }

  _areMaterialsSame(matDataA, matDataB) {
    return JSON.stringify(matDataA) === JSON.stringify(matDataB);
  }

  _renderFaces() {
    this._cleanup();

    // Safety checks
    if (!this.scene) {
      console.error("[Faces] No scene available");
      return;
    }

    if (!this.faceData || !this.faceData.length) {
      console.warn("[Faces] No faces data to render");
      return;
    }

    console.log("[Faces] Rendering", this.faceData.length, "faces");

    try {
      this.faceData.forEach((face, faceIndex) => {
        const materialData = face.data?.material || {};

        // Find group or create new one
        let groupIndex = this.materialGroups.findIndex((group) =>
          this._areMaterialsSame(group.materialData, materialData),
        );

        if (groupIndex === -1) {
          groupIndex = this.materialGroups.length;
          this.materialGroups.push({
            materialData: materialData,
            faces: [],
          });
        }

        // Add face to appropriate material group
        this.materialGroups[groupIndex].faces.push(faceIndex);
      });

      console.log(
        `[Faces] Grouped faces into ${this.materialGroups.length} material groups`,
      );

      // Second pass creates meshess
      this.materialGroups.forEach((group, groupIndex) => {
        const positions = [];
        let validFaceCount = 0;

        // vertices for this material group
        group.faces.forEach((faceIndex) => {
          const face = this.faceData[faceIndex];
          let validVertices = 0;

          for (let i = 0; i < face.vertices.length; i++) {
            const vertexId = face.vertices[i];
            const position = this.graphComponent.getNodePosition(vertexId);

            if (position) {
              positions.push(position.x, position.y, position.z);
              validVertices++;
            }
          }

          if (validVertices === 3) {
            validFaceCount++;
          }
        });

        if (positions.length > 0) {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3),
          );
          geometry.computeVertexNormals();

          // Create material and mesh
          const material = Materials.createFaceMaterial(group.materialData);
          const mesh = new THREE.Mesh(geometry, material);
          this.scene.add(mesh);
          this.batchedMeshes.push(mesh);

          console.log(
            `[Faces] Created batched mesh ${groupIndex} with ${validFaceCount} faces`,
          );
        }
      });

      console.log(
        `[Faces] Added ${this.batchedMeshes.length} batched meshes to scene`,
      );
    } catch (e) {
      console.error("[Faces] Error rendering batched faces:", e);
    }
  }
}

export default Faces;

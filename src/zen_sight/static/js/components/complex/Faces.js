const THREE = window.THREE || {};
import Materials from './Materials.js';

class Faces {
    constructor(graphComponent) {
        this.graphComponent = graphComponent;
        this.scene = graphComponent.getScene();
        this.meshes = [];
        this.data = null;
        this.faceData = []; // Store original face data for updates

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
        if (!this.scene || !this.faceData.length || !this.meshes.length) {
            return this;
        }

        this.faceData.forEach((face, index) => {
            if (index >= this.meshes.length) return;

            const mesh = this.meshes[index];
            if (!mesh) return;

            try {
                const positions = [];

                for (let i = 0; i < face.vertices.length; i++) {
                    const vertexId = face.vertices[i];
                    const position = this.graphComponent.getNodePosition(vertexId);

                    if (position) {
                        positions.push(position.x, position.y, position.z);
                    }
                }

                if (positions.length === 9) { // 3 vertices * 3 coordinates
                    mesh.geometry.setAttribute('position', 
                        new THREE.Float32BufferAttribute(positions, 3));
                    mesh.geometry.attributes.position.needsUpdate = true;
                    mesh.geometry.computeVertexNormals();
                }
            } catch (e) {
                console.error(```[Faces] Error updating face ${index}:```, e);
            }
        });

        return this;
    }

    _cleanup() {
        // Remove all existing meshes and geometries from the scene
        for (const mesh of this.meshes) {
            if (this.scene) {
                this.scene.remove(mesh);
            }

            if (mesh.geometry) {
                mesh.geometry.dispose();
            }

            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(material => material.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        }

        this.meshes = [];
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
        console.log("[Faces] Sample face:", this.faceData[0]);

        // Process each face
        this.faceData.forEach((face, index) => {
            try {
                // Check if face has vertices array property
                if (!face.vertices || !Array.isArray(face.vertices)) {
                    console.error(```[Faces] Face ${index} has no vertices array:```, face);
                    return;
                }

                // Validate we have exactly 3 vertices
                if (face.vertices.length !== 3) {
                    console.error(```[Faces] Face ${index} must have exactly 3 vertices, found ${face.vertices.length}:```, face);
                    return;
                }

                const faceVertices = [];

                // Get each vertex position
                for (let i = 0; i < face.vertices.length; i++) {
                    const vertexId = face.vertices[i];

                    const position = this.graphComponent.getNodePosition(vertexId);

                    if (!position) {
                        console.error(```[Faces] Position not found for vertex ID ${vertexId} in face ${index}```);
                        continue;
                    }

                    faceVertices.push(new THREE.Vector3(position.x, position.y, position.z));
                }

                // Get material data from face.data.material (processed by DataProcessor)
                const materialData = face.data?.material || {};

                if (faceVertices.length < 3) {
                    console.error(```[Faces] Not enough vertices (${faceVertices.length}) for face ${index}```);
                    return;
                }

                // Create face geometry
                const geometry = new THREE.BufferGeometry();

                const positions = [];
                faceVertices.forEach(v => {
                    positions.push(v.x, v.y, v.z);
                });

                geometry.setAttribute('position', 
                    new THREE.Float32BufferAttribute(positions, 3));

                geometry.computeVertexNormals();

                // Create material and mesh
                const material = Materials.createFaceMaterial(materialData);
                const mesh = new THREE.Mesh(geometry, material);

                this.scene.add(mesh);
                this.meshes.push(mesh);
                console.log(`[Faces] Added face ${index} to scene`);
            } catch (e) {
                console.error(`[Faces] Error rendering face ${index}:`, e);
            }
        });
    }
}

export default Faces;

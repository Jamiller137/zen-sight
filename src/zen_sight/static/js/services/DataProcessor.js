class DataProcessor {
    static processGraphData(data) {
        const nodes = this._processNodes(data.vertices || data.nodes || []);
        const links = this._processLinks(data.edges || data.links || []);
        const faces = this._processFaces(data.faces || []);
        const tetrahedra = this._processTetrahedra(data.tetrahedra || []);

        return {
            nodes,
            links,
            faces,
            tetrahedra
        };
    }

    static _processNodes(nodes) {
        return nodes.map(node => {
            // Extract material properties to match Python visualization options
            const material = {
                color: node.material?.color || node.data?.color || 0x222222,
                size: node.material?.size || node.data?.size || 5,
                shape: node.material?.shape || node.data?.shape || 'sphere',
                opacity: node.material?.opacity || node.data?.opacity || 1.0
            };

            return {
                id: node.id,
                x: node.position?.x || 0,
                y: node.position?.y || 0,
                z: node.position?.z || 0,
                // Keep original data and add processed material
                data: {
                    ...node.data,
                    material: material
                }
            };
        });
    }

    static _processLinks(links) {
        return links.map(link => {
            // Extract material properties (width generally doesn't work)
            const material = {
                color: link.material?.color || link.data?.color || 0x005ebb,
                width: link.material?.width || link.data?.width || 1,
                opacity: link.material?.opacity || link.data?.opacity || 0.8,
                dashed: link.material?.dashed || link.data?.dashed || false
            };

            return {
                source: link.source,
                target: link.target,
                // Keep original data and add processed material
                data: {
                    ...link.data,
                    material: material
                }
            };
        });
    }

    static _processFaces(faces) {
        return faces.map(face => {
            // Extract material properties to match Python visualization
            const material = {
                color: face.material?.color || face.data?.color || 0x3366CC,
                opacity: face.material?.opacity || face.data?.opacity || 0.4,
                wireframe: face.material?.wireframe || face.data?.wireframe || false,
                side: face.material?.side || face.data?.side || 'double'
            };

            return {
                id: face.id,
                vertices: face.vertices || [],
                // Keep original data and add processed material
                data: {
                    ...face.data,
                    material: material
                }
            };
        });
    }

    static _processTetrahedra(tetrahedra) {
        return tetrahedra.map(tetra => {
            // Extract material properties to match Python visualization
            const material = {
                color: tetra.material?.color || tetra.data?.color || 0x99BBEE,
                opacity: tetra.material?.opacity || tetra.data?.opacity || 0.2,
                wireframe: tetra.material?.wireframe || tetra.data?.wireframe || false,
                side: tetra.material?.side || tetra.data?.side || 'double'
            };

            return {
                id: tetra.id,
                vertices: tetra.vertices || [],
                // Keep original data and add processed material
                data: {
                    ...tetra.data,
                    material: material
                }
            };
        });
    }
}

export default DataProcessor;

import { useCallback, useRef } from "react";
import * as THREE from "three";

export const useFaceRendering = (
  graphRef,
  graphType,
  showFaces,
  graphData,
  graphConfig,
  isReplayingOperation,
) => {
  const faceMeshesRef = useRef([]);

  const paintFaces2D = useCallback(
    (ctx) => {
      if (!showFaces || !graphData.faces?.length || !graphData.nodes) return;

      ctx.save();

      const nodeMap = {};
      graphData.nodes.forEach((node) => {
        if (node.x !== undefined && node.y !== undefined) {
          nodeMap[node.id] = { x: node.x, y: node.y };
        }
      });

      graphData.faces.forEach((face, index) => {
        if (!face.nodes || !Array.isArray(face.nodes)) {
          console.warn(`Face ${index} has invalid nodes property:`, face.nodes);
          return;
        }

        const positions = face.nodes
          .map((nodeId) => nodeMap[nodeId])
          .filter((pos) => pos);

        if (positions.length === 3) {
          ctx.beginPath();
          ctx.moveTo(positions[0].x, positions[0].y);
          ctx.lineTo(positions[1].x, positions[1].y);
          ctx.lineTo(positions[2].x, positions[2].y);
          ctx.closePath();

          ctx.fillStyle =
            graphConfig.faceFillColor || "rgba(100, 150, 250, 0.2)";
          ctx.fill();

          ctx.strokeStyle =
            graphConfig.faceStrokeColor || "rgba(100, 150, 250, 0.5)";
          ctx.lineWidth = graphConfig.faceStrokeWidth || 1;
          ctx.stroke();
        } else {
          console.warn(
            `Face ${index} has ${positions.length} valid positions, expected 3`,
          );
        }
      });

      ctx.restore();
    },
    [showFaces, graphData, graphConfig],
  );

  const cleanupFaces3D = useCallback(() => {
    if (!graphRef.current || graphType !== "3D") return;

    const fg = graphRef.current;
    if (!fg.scene) return;

    const scene = fg.scene();
    faceMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    faceMeshesRef.current = [];
  }, [graphType]);

  const updateFaces3D = useCallback(() => {
    if (!graphRef.current || graphType !== "3D" || isReplayingOperation) return;

    const fg = graphRef.current;
    if (!fg.scene) return;

    const scene = fg.scene();

    // Clean up existing meshes
    faceMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    faceMeshesRef.current = [];

    if (!showFaces || !graphData.faces?.length) return;

    const nodeMap = {};
    graphData.nodes.forEach((node) => {
      nodeMap[node.id] = {
        x: node.x || 0,
        y: node.y || 0,
        z: node.z || 0,
      };
    });

    console.log("3D Face rendering debug:", {
      facesCount: graphData.faces.length,
      nodesCount: graphData.nodes.length,
      nodeMapSize: Object.keys(nodeMap).length,
      sampleFace: graphData.faces[0],
      sampleNode: graphData.nodes[0],
    });

    graphData.faces.forEach((face, index) => {
      // Debug each face
      console.log(`3D Face ${index}:`, {
        face,
        faceNodes: face.nodes,
        nodeExists: face.nodes?.map((nodeId) => ({
          nodeId,
          exists: nodeMap[nodeId] !== undefined,
          position: nodeMap[nodeId],
        })),
      });

      if (!face.nodes || !Array.isArray(face.nodes)) {
        console.warn(
          `3D Face ${index} has invalid nodes property:`,
          face.nodes,
        );
        return;
      }

      const positions = face.nodes
        .map((nodeId) => nodeMap[nodeId])
        .filter((pos) => pos);

      console.log(`3D Face ${index} positions:`, positions);

      if (positions.length === 3) {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(graphConfig.faceFillColor || "#6496fa"),
          opacity: graphConfig.faceOpacity || 0.3,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          positions[0].x,
          positions[0].y,
          positions[0].z,
          positions[1].x,
          positions[1].y,
          positions[1].z,
          positions[2].x,
          positions[2].y,
          positions[2].z,
        ]);

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3),
        );
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { isFace: true, faceId: face.id };
        scene.add(mesh);
        faceMeshesRef.current.push(mesh);
        console.log(`Successfully created mesh for face ${index}`);
      } else {
        console.warn(
          `3D Face ${index} has ${positions.length} valid positions, expected 3`,
        );
      }
    });

    console.log(
      `Total 3D face meshes created: ${faceMeshesRef.current.length}`,
    );
  }, [showFaces, graphData, graphConfig, graphType, isReplayingOperation]);

  const handle3DEngineTick = useCallback(() => {
    if (!graphRef.current || isReplayingOperation) return;

    const fg = graphRef.current;
    fg.tickCount = (fg.tickCount || 0) + 1;

    if (fg.tickCount % 60 === 0) {
      updateFaces3D();
    }
  }, [updateFaces3D, isReplayingOperation]);

  return {
    paintFaces2D,
    updateFaces3D,
    cleanupFaces3D,
    handle3DEngineTick,
  };
};

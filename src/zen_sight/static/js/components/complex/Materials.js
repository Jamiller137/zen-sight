class Materials {
  static createVertexMaterial(options = {}) {
    // Set defaults
    // There is currently a bug (?) when we set
    // the color to 0x000000. Which sets to default.
    const config = {
      color: options?.color || 0x888888,
      opacity: options?.opacity || 1.0,
      transparent: options?.opacity !== undefined && options.opacity < 1.0,
    };

    return new THREE.MeshBasicMaterial(config);
  }

  static createEdgeMaterial(options = {}) {
    const config = {
      color: options?.color || 0x666666,
      opacity: options?.opacity || 1.0,
      transparent: options?.opacity !== undefined && options.opacity < 1.0,
      linewidth: options?.width || 1.0,
    };

    // Handle dashed lines
    if (options?.dashed) {
      config.dashSize = options.dashSize || 3;
      config.gapSize = options.gapSize || 1;
      const material = new THREE.LineDashedMaterial(config);
      material.isDashed = true;
      return material;
    } else {
      return new THREE.LineBasicMaterial(config);
    }
  }

  static createFaceMaterial(options = {}) {
    // need MeshPhongMaterial for features like shininess and flatShading
    const config = {
      color: options?.color || 0x3366cc,
      opacity: options?.opacity || 0.4,
      transparent: true,
      side: THREE.DoubleSide,
      wireframe: options?.wireframe || false,
    };

    let material;

    // If we need features like flatShading or shininess, use MeshPhongMaterial
    if (
      options?.flatShading !== undefined ||
      options?.shininess !== undefined
    ) {
      material = new THREE.MeshPhongMaterial(config);

      if (options?.flatShading !== undefined) {
        material.flatShading = options.flatShading;
      }

      if (options?.shininess !== undefined) {
        material.shininess = options.shininess;
      }
    } else {
      // For simple faces, MeshBasicMaterial is more efficient
      material = new THREE.MeshBasicMaterial(config);
    }

    return material;
  }

  static createTetrahedronMaterial(options = {}) {
    // Similar to faces, but with different defaults
    const config = {
      color: options?.color || 0x222222,
      opacity: options?.opacity || 0.8,
      transparent: true,
      side: THREE.DoubleSide,
      wireframe: options?.wireframe || false,
    };

    // Choose material type
    if (
      options?.flatShading !== undefined ||
      options?.shininess !== undefined
    ) {
      const material = new THREE.MeshPhongMaterial(config);

      if (options?.flatShading !== undefined) {
        material.flatShading = options.flatShading;
      }

      if (options?.shininess !== undefined) {
        material.shininess = options.shininess;
      }

      return material;
    } else {
      return new THREE.MeshBasicMaterial(config);
    }
  }
}

export default Materials;

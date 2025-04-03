class MaterialManager:
    """
    Manages material properties for simplicial elements.

    Handles custom materials for vertices, edges, faces, and tetrahedra.
    """

    def __init__(self):
        """Initialize the material manager with empty material dictionaries."""
        self.vertex_materials = {}      # key by vertex id
        self.edge_materials = {}        # keyed by pair of vertex ids
        self.face_materials = {}        # keyed by 3-tuple of vertex ids
        self.tetrahedron_materials = {} # keyed by 4-tuple of vertex ids
        self.default_materials = {} 

    def set_vertex_material(self, vertex_id, material_props):
        """
        Set custom material properties for a specific vertex.

        Parameters
        -----------
        `vertex_id`:
            The identifier of the vertex to customize.

        `material_props`:
            Dictionary of material properties. Supported properties include:
            - ```color : int```
                Hexadecimal color code (e.g., 0xFF0000 for red).
            - ```size : float```
                Size of the vertex node (default is 5).
            - ```opacity : float```
                Opacity value between 0.0 (transparent) and 1.0 (opaque).
            - ```tooltip : str```
                Text to display when hovering over the vertex. (not implemented)
            - ```label : str```
                Text label to display with the vertex.
            - ```shape : str```
                Node shape (e.g., 'sphere', 'box', 'cylinder').
        """
        self.vertex_materials[vertex_id] = material_props

    def set_edge_material(self, source_id, target_id, material_props):
        """
        Set custom material properties for a specific edge.

        Parameters
        -----------
        `source_id`:
            The identifier of the source vertex.
        `target_id`:
            The identifier of the target vertex.
        `material_props`:
            Dictionary of material properties. Supported properties include:
            - ```color : int```
                Hexadecimal color code (e.g., 0x00FF00 for green).
            - ```width : float```
                Width/thickness of the edge line (default is 1).
            - ```opacity : float```
                Opacity value between 0.0 (transparent) and 1.0 (opaque).
            - ```weight : float```
                Weight value for the edge, can affect physics simulation. (not implemented)
            - ```dashed : bool```
                Whether to render the edge as a dashed line.
            - ```arrow : bool```
                Whether to show directional arrows on the edge. (not implemented)
        """
        edge_key = (source_id, target_id)
        self.edge_materials[edge_key] = material_props

    def set_face_material(self, vertex_ids, material_props):
        """
        Set custom material properties for a specific face. Some of which are not implemented.

        Parameters
        -----------
        `vertex_ids`:
            List or tuple of vertex identifiers that form the face.
        `material_props`:
            Dictionary of material properties. Supported properties include:
            - ```color: int```
                Hexadecimal color code (e.g., 0x0000FF for blue).
            - ```opacity : float```
                Opacity value between 0.0 (transparent) and 1.0 (opaque).
            - ```wireframe : bool```
                Whether to render the face as a wireframe (default is False).
            - ```side : str```
                Which side of the face to render ('front', 'back', or 'double').
            - ```shininess : float```
                Material shininess for lighting effects.
            - ```emissive : int```
                Hexadecimal color code for emissive lighting.
            - ```flatShading : bool```
                Whether to use flat shading instead of smooth shading.
        """
        face_key = tuple(sorted(vertex_ids))  # Sort to ensure consistent key
        self.face_materials[face_key] = material_props

    def set_tetrahedron_material(self, vertex_ids, material_props):
        """
        Set custom material properties for a specific tetrahedron. Some of which are not implemented.

        Parameters
        -----------
        `vertex_ids`:
            List or tuple of vertex identifiers that form the tetrahedron.
        `material_props`:
            Dictionary of material properties. Supported properties include:
            - ```color : int```
                Hexadecimal color code (e.g., 0xFF00FF for magenta).
            - ```opacity : float```
                Opacity value between 0.0 (transparent) and 1.0 (opaque).
            - ```wireframe : bool```
                Whether to render the tetrahedron as a wireframe (default is False).
            - ```showEdges : bool```
                Whether to highlight edges of the tetrahedron.
        """
        tetrahedron_key = tuple(sorted(vertex_ids))  # Sort to ensure consistent key
        self.tetrahedron_materials[tetrahedron_key] = material_props

    def set_default_materials(self, material_defaults):
        """
        Set default material properties for all elements that don't have specific customizations.

        Parameters
        -----------
        `material_defaults`:
            Dictionary containing default properties for each element type.
            Supported keys:
            - ```vertices : dict```
                Default material properties for vertices.
            - ```edges : dict```
                Default material properties for edges.
            - ```faces : dict```
                Default material properties for faces.
            - ```tetrahedra : dict```
                Default material properties for tetrahedra.
        """
        self.default_materials = material_defaults

    def get_vertex_material(self, vertex, default_size=5):
        """Get material properties for a vertex, applying defaults as needed."""
        # Defaults
        data_props = {
            "vertex": str(vertex),
            "size": default_size,
            "color": int(hash(str(vertex)) % 0xFFFFFF),
            "tooltip": f"Vertex {vertex}"
        }

        # Apply default materials if specified
        if 'vertices' in self.default_materials:
            data_props.update(self.default_materials['vertices'])

        # Override with custom materials
        if vertex in self.vertex_materials:
            data_props.update(self.vertex_materials[vertex])

        return data_props

    def get_edge_material(self, source_vertex, target_vertex, index):
        """Get material properties for an edge, applying defaults as needed."""
        # Defaults
        edge_props = {
            "weight": 1,
            "color": int(hash(f"edge-{index}") % 0xFFFFFF)
        }

        # Apply default materials
        if 'edges' in self.default_materials:
            edge_props.update(self.default_materials['edges'])

        # Apply custom edge materials
        edge_key = (source_vertex, target_vertex)
        reverse_edge_key = (target_vertex, source_vertex)

        if edge_key in self.edge_materials:
            edge_props.update(self.edge_materials[edge_key])
        elif reverse_edge_key in self.edge_materials:
            edge_props.update(self.edge_materials[reverse_edge_key])

        return edge_props

    def get_face_material(self, vertices, index):
        """Get material properties for a face, applying defaults as needed."""
        # Default face properties
        face_props = {
            "color": int(hash(f"face-{index}") % 0xFFFFFF),
            "opacity": 0.5,
            "wireframe": False
        }

        # Apply default materials
        if 'faces' in self.default_materials:
            face_props.update(self.default_materials['faces'])

        # Check and apply custom material properties
        face_key = tuple(sorted(vertices))
        if face_key in self.face_materials:
            face_props.update(self.face_materials[face_key])

        return face_props

    def get_tetrahedron_material(self, vertices, index):
        """Get material properties for a tetrahedron, applying defaults as needed."""
        # Defaults
        tetra_props = {
            "color": int(hash(str(index)) % 0xFFFFFF) & 0x7FFFFF | 0x400000,  # Ensure visible color
            "opacity": 0.6
        }

        # Apply user-specified defaults
        if 'tetrahedra' in self.default_materials:
            tetra_props.update(self.default_materials['tetrahedra'])

        # Apply custom materials
        tetra_key = tuple(sorted(vertices[:4]))
        if tetra_key in self.tetrahedron_materials:
            tetra_props.update(self.tetrahedron_materials[tetra_key])

        return tetra_props

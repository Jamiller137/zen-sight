import logging
from typing import Dict, Any, Optional, List, Tuple

import networkx as nx

from ..core.simplex_processor import SimplexProcessor
from .materials import MaterialManager
from ..server.flask_app import create_visualization_server

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("SimplexTreeVisualizer")


class SimplexTreeVisualizer:
    """
    Interactive visualization tool for SimplexTree structures.

    Converts simplicial complexes into interactive 3D network visualizations.
    Supports Flask interactive visualization.

    Parameters
    ----------
    `simplex_tree` : SimplexTree
        The SimplexTree instance to visualize
    `max_dim` : int, optional (default=None)
        Maximum dimension of simplices to visualize.
        If None, all simplices are included.
    `node_size` : int, optional (default=5)
        Base size for node display
    """

    def __init__(self, simplex_tree, max_dim=None, node_size=5):
        self.processor = SimplexProcessor(simplex_tree, max_dim)
        self.materials = MaterialManager()
        self.node_size = node_size
        self._data = None

    def set_vertex_material(self, vertex_id, material_props):
        """
        Set custom material properties for a vertex in the visualization.

        Parameters
        ----------
        vertex_id : Any
            The identifier of the vertex to customize.
        material_props : dict
            Dictionary of material properties. Supported properties include:
            - color : int
                Hexadecimal color code (e.g., 0xFF0000 for red).
            - size : float
                Size of the vertex node (default is 5).
            - opacity : float
                Opacity value between 0.0 (transparent) and 1.0 (opaque).
            - tooltip : str
                Text to display when hovering over the vertex. (not implemented)
            - label : str
                Text label to display with the vertex. (not implemented)
            - shape : str
                Node shape (e.g., 'sphere', 'box', 'cylinder').

        Examples
        --------
        >>> visualizer.set_vertex_material(1, {"color": 0xFF0000, "size": 8})
        >>> visualizer.set_vertex_material("v1", {"opacity": 0.7, "label": "Vertex 1"})
        """
        self.materials.set_vertex_material(vertex_id, material_props)

    def set_edge_material(self, source_id, target_id, material_props):
        """
        Set custom material properties for a specific edge in the visualization.

        Parameters
        ----------
        source_id : Any
            The identifier of the source vertex.
        target_id : Any
            The identifier of the target vertex.
        material_props : dict
            Dictionary of material properties. Supported properties include:
            - color : int
                Hexadecimal color code (e.g., 0x00FF00 for green).
            - width : float
                Width/thickness of the edge line (default is 1).
            - opacity : float
                Opacity value between 0.0 (transparent) and 1.0 (opaque).
            - weight : float
                Weight value for the edge, can affect physics simulation. (not implemented)
            - dashed : bool
                Whether to render the edge as a dashed line.
            - arrow : bool
                Whether to show directional arrows on the edge. (not implemented)

        Examples
        --------
        >>> visualizer.set_edge_material(1, 2, {"color": 0x00FF00, "width": 2.0})
        >>> visualizer.set_edge_material("v1", "v2", {"dashed": True, "opacity": 0.8})
        """
        self.materials.set_edge_material(source_id, target_id, material_props)

    def set_face_material(self, vertex_ids, material_props):
        """
        Set custom material properties for a specific triangular face in the visualization.

        Parameters
        ----------
        vertex_ids : list or tuple
            List or tuple of vertex identifiers that form the face.
        material_props : dict
            Dictionary of material properties. Supported properties include:
            - color : int
                Hexadecimal color code (e.g., 0x0000FF for blue).
            - opacity : float
                Opacity value between 0.0 (transparent) and 1.0 (opaque).
            - wireframe : bool
                Whether to render the face as a wireframe (default is False).
            - side : str
                Which side of the face to render ('front', 'back', or 'double').
            - shininess : float
                Material shininess for lighting effects.
            - emissive : int
                Hexadecimal color code for emissive lighting.
            - flatShading : bool
                Whether to use flat shading instead of smooth shading.

        Examples
        --------
        >>> visualizer.set_face_material([1, 2, 3], {"color": 0x0000FF, "opacity": 0.7})
        >>> visualizer.set_face_material(("v1", "v2", "v3"), {"wireframe": True})
        """
        self.materials.set_face_material(vertex_ids, material_props)

    def set_tetrahedron_material(self, vertex_ids, material_props):
        """
        Set custom material properties for a specific tetrahedron in the visualization.

        Parameters
        ----------
        vertex_ids : list or tuple
            List or tuple of 4 vertex identifiers that form the tetrahedron.
        material_props : dict
            Dictionary of material properties. Supported properties include:
            - color : int
                Hexadecimal color code (e.g., 0xFF00FF for magenta).
            - opacity : float
                Opacity value between 0.0 (transparent) and 1.0 (opaque).
            - wireframe : bool
                Whether to render the tetrahedron as a wireframe (default is False).
            - showEdges : bool
                Whether to highlight edges of the tetrahedron.

        Examples
        --------
        >>> visualizer.set_tetrahedron_material([1, 2, 3, 4], {"color": 0xFF00FF, "opacity": 0.5})
        >>> visualizer.set_tetrahedron_material(("v1", "v2", "v3", "v4"), {"wireframe": True})
        """
        self.materials.set_tetrahedron_material(vertex_ids, material_props)

    def set_default_materials(self, material_defaults):
        """
        Set default material properties for all visualization elements.

        Establish baseline appearance for all vertices, edges,
        faces, and tetrahedra in the visualization.

        Parameters
        ----------
        material_defaults : dict
            Dictionary containing default properties for each element type.
            Supported keys:
            - vertices : dict
                Default material properties for all vertices.
            - edges : dict
                Default material properties for all edges.
            - faces : dict
                Default material properties for all triangular faces.
            - tetrahedra : dict
                Default material properties for all tetrahedra.

        Examples
        --------
        >>> visualizer.set_default_materials({
        ...     "vertices": {"color": 0xCCCCCC, "size": 4},
        ...     "edges": {"color": 0x999999, "width": 1.5},
        ...     "faces": {"opacity": 0.6, "wireframe": True}
        ... })
        """
        self.materials.set_default_materials(material_defaults)

    def _prepare_visualization_data(self):
        """
        Transform simplex tree structure into format compatible with the js frontend.

        Notes
        -----
        See `simplex_processor.py`
        """
        if self._data is not None:
            return self._data

        vertices, vertex_ids = self.processor.extract_vertices()

        # Build graph, faces, and tetrahedra
        G, raw_edges = self.processor.build_graph(vertex_ids)
        vertex_data = self._generate_vertex_data(G, vertex_ids)
        edge_data = self._generate_edge_data(raw_edges, vertex_ids)
        faces = self._process_faces(vertex_ids)
        tetrahedra = self._process_tetrahedra(vertex_ids)

        self._data = {
            "vertices": vertex_data,
            "edges": edge_data,
            "faces": faces,
            "tetrahedra": tetrahedra,
        }

        return self._data

    def _generate_vertex_data(self, G, vertex_ids):
        """Generate vertex data with 3D positions."""
        positions = nx.spring_layout(G, dim=3)

        vertices = []
        for vertex, node_id in vertex_ids.items():
            if node_id in positions:
                pos = positions[node_id]
                x, y, z = [float(coord * 100) for coord in pos]

                data_props = self.materials.get_vertex_material(vertex, self.node_size)

                vertices.append(
                    {
                        "id": str(node_id),
                        "position": {"x": x, "y": y, "z": z},
                        "data": data_props,
                    }
                )

        return vertices

    def _generate_edge_data(self, raw_edges, vertex_ids):
        """Generate edge data for visualization materials."""
        edge_data = []

        for i, e in enumerate(raw_edges):
            source_vertex, target_vertex = e[0], e[1]

            if source_vertex in vertex_ids and target_vertex in vertex_ids:
                source_id = str(vertex_ids[source_vertex])
                target_id = str(vertex_ids[target_vertex])

                edge_props = self.materials.get_edge_material(
                    source_vertex, target_vertex, i
                )

                # Create edge object
                edge_data.append(
                    {
                        "id": f"edge-{i}",
                        "source": source_id,
                        "target": target_id,
                        "data": edge_props,
                    }
                )

        logger.info(f"Prepared {len(edge_data)} edges for visualization")
        return edge_data

    def _process_faces(self, vertex_ids):
        """Process 2-simplices into triangular faces with materials."""
        faces = []
        triangles = self.processor.get_faces()
        logger.info(f"Found {len(triangles)} triangular faces")

        for i, triangle in enumerate(triangles):
            # Extract vertices from the triangle
            if isinstance(triangle[0], (list, tuple)):
                vertices = triangle[0]
            else:
                vertices = triangle[:3]

            # Map to vertex IDs
            vertex_list = [str(vertex_ids[v]) for v in vertices if v in vertex_ids]

            if len(vertex_list) == 3:
                face_props = self.materials.get_face_material(vertices, i)

                faces.append(
                    {"id": f"face-{i}", "vertices": vertex_list, "data": face_props}
                )

        logger.info(f"Prepared {len(faces)} faces for visualization")
        return faces

    def _process_tetrahedra(self, vertex_ids):
        """Process 3-simplices into tetrahedra with materials."""
        tetrahedra = []
        tetras = self.processor.get_tetrahedra()
        logger.info(f"Found {len(tetras)} tetrahedra")

        for i, tetra in enumerate(tetras):
            # Extract vertices
            if isinstance(tetra[0], (list, tuple)):
                vertices = tetra[0]
            else:
                vertices = tetra[:4]

            if len(vertices) >= 4 and all(v in vertex_ids for v in vertices):
                # Get material properties
                tetra_props = self.materials.get_tetrahedron_material(vertices, i)

                # Create a tetrahedron object
                tetra_obj = {
                    "id": f"tetra-{i}",
                    "vertices": [str(vertex_ids[v]) for v in vertices[:4]],
                    "data": tetra_props,
                }
                tetrahedra.append(tetra_obj)

        logger.info(f"Prepared {len(tetrahedra)} tetrahedra for visualization")
        return tetrahedra

    def show(self, port=5000, debug=False):
        """Launch visualization in web browser."""

        data = self._prepare_visualization_data()

        # run the Flask server
        app = create_visualization_server(data)

        logger.info(f"Starting SimplexTree visualization server on port {port}")
        app.run(debug=debug, port=port, use_reloader=False)

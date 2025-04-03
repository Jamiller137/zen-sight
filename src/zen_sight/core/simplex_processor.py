import logging
import networkx as nx

logger = logging.getLogger('SimplexProcessor')

class SimplexProcessor:
    """
    Processes simplicial complexes for visualization.

    Extracts vertices, edges, faces, and tetrahedra from a simplicial complex.

    Parameters
    ----------
    simplex_tree : SimplexTree
        The SimplexTree instance to process. Expected to have methods like
        get_simplices(dim) to extract simplices of specific dimensions.
    max_dim : int, optional (default=None)
        Maximum dimension of simplices to process.
        If None, uses the full dimension of the simplex_tree.
    """

    def __init__(self, simplex_tree, max_dim=None):
        """
        Initialize the simplex processor.

        Parameters
        ----------
        simplex_tree : SimplexTree
            The SimplexTree instance to process
        max_dim : int, optional (default=None)
            Maximum dimension of simplices to process.
            If None, all simplices are included.
        """
        self.simplex_tree = simplex_tree
        self.max_dim = max_dim if max_dim is not None else simplex_tree.dimension

    def extract_vertices(self):
        """
        Extract unique vertices from all simplices.

        Collects all vertices appearing in any simplex up to the maximum 
        dimension and creates a mapping of vertex identifiers to sequential indices.


        Returns
        -------
        tuple
            A tuple containing:
            - vertices : list
                List of all unique vertices in the simplicial complex
            - vertex_ids : dict
                Mapping from vertex identifiers to sequential indices

        Examples
        --------
        >>> processor = SimplexProcessor(simplex_tree, max_dim=2)
        >>> vertices, vertex_ids = processor.extract_vertices()
        >>> print(f"Found {len(vertices)} vertices")
        Found 15 vertices

        Notes
        -----
        - This should also be able to visualize non-simplicial complexes. However,
        this will mess with the force directed graph since there is no force linking faces and tetrahedra yet.
        - Should specify visualization properties for problematic faces, edges, and tetraheda. 
        """
        all_simplices = []
        for dim in range(self.max_dim + 1):
            all_simplices.extend(self.simplex_tree.get_simplices(dim=dim))

        unique_vertices = set()
        for simplex in all_simplices:
            for vertex in simplex:
                unique_vertices.add(vertex)

        vertices = sorted(list(unique_vertices))
        vertex_ids = {v: i for i, v in enumerate(vertices)}

        logger.info(f"Found {len(vertices)} unique vertices")
        return vertices, vertex_ids

    def build_graph(self, vertex_ids):
        """
        Build a NetworkX graph from 1-simplices (edges).

        Creates a graph representation of the simplicial complex where
        nodes correspond to 0-simplices (vertices) and edges correspond
        to 1-simplices.

        Parameters
        ----------
        vertex_ids : dict
            Mapping from vertex identifiers to sequential indices

        Returns
        -------
        tuple
            A tuple containing:
            - G : networkx.Graph
                NetworkX graph representing the simplicial complex
            - edges : list
                List of all 1-simplices (edges) in the simplicial complex

        Examples
        --------
        >>> _, vertex_ids = processor.extract_vertices()
        >>> graph, edges = processor.build_graph(vertex_ids)
        >>> print(f"Graph has {graph.number_of_nodes()} nodes and {graph.number_of_edges()} edges")
        Graph has 15 nodes and 45 edges
        """
        edges = list(self.simplex_tree.get_simplices(dim=1))
        logger.info(f"Found {len(edges)} edges")

        G = nx.Graph()
        G.add_nodes_from(range(len(vertex_ids)))

        edge_list = []
        for e in edges:
            source_vertex, target_vertex = e[0], e[1]
            if source_vertex in vertex_ids and target_vertex in vertex_ids:
                source_id = vertex_ids[source_vertex]
                target_id = vertex_ids[target_vertex]
                edge_list.append((int(source_id), int(target_id)))

        G.add_edges_from(edge_list)
        return G, edges

    def generate_3d_layout(self, graph):
        """
        Generate 3D positions for vertices using force-directed layout.

        Uses NetworkX's spring layout algorithm to position vertices in 3D space,
        creating a visually appealing arrangement that preserves the connectivity
        structure of the simplicial complex.

        Parameters
        ----------
        graph : networkx.Graph
            The graph representing the simplicial complex

        Returns
        -------
        dict
            Dictionary mapping node indices to 3D coordinates (x, y, z)

        Examples
        --------
        >>> graph, _ = processor.build_graph(vertex_ids)
        >>> positions = processor.generate_3d_layout(graph)
        >>> print(f"First vertex position: {positions[0]}")
        First vertex position: [ 0.21, -0.54, 0.11]
        """
        return nx.spring_layout(graph, dim=3)

    def get_faces(self):
        """
        Extract 2-simplices (triangular faces) from the simplicial complex.

        Retrieves all triangular faces if the maximum dimension is at least 2.

        Returns
        -------
        list
            List of 2-simplices (triangular faces), where each face is
            represented as a tuple of 3 vertex identifiers

        Examples
        --------
        >>> faces = processor.get_faces()
        >>> print(f"Found {len(faces)} triangular faces")
        Found 35 triangular faces
        """
        return list(self.simplex_tree.get_simplices(dim=2)) if self.max_dim >= 2 else []

    def get_tetrahedra(self):
        """
        Extract 3-simplices (tetrahedra) from the simplicial complex.

        Retrieves all tetrahedra if the maximum dimension is at least 3.

        Returns
        -------
        list
            List of 3-simplices (tetrahedra), where each tetrahedron is
            represented as a tuple of 4 vertex identifiers

        Examples
        --------
        >>> tetrahedra = processor.get_tetrahedra()
        >>> print(f"Found {len(tetrahedra)} tetrahedra")
        Found 15 tetrahedra
        """
        return list(self.simplex_tree.get_simplices(dim=3)) if self.max_dim >= 3 else []
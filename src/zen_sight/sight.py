from typing import Dict, List, Any, Optional, Tuple


class Sight:
    def __init__(
        self,
        graph_type: str = "3D",
        nodes: Optional[List[Dict]] = None,
        links: Optional[List[Dict]] = None,
        faces: Optional[List[Dict]] = None,
        config: Optional[Dict] = None,
    ):
        """
        Initialize Sight visualization

        Args:
            graph_type: "2D" or "3D" (default: "3D")
            nodes: List of node dictionaries with 'id' field
            links: List of link dictionaries with 'source' and 'target' fields
            config: Configuration dictionary for ForceGraph

        Notes:
            See documentation for react-force-graph for more information
        """
        if graph_type not in ["2D", "3D"]:
            raise ValueError("graph_type must be '2D' or '3D'")

        self.graph_type = graph_type
        self.nodes = nodes or []
        self.links = links or []
        self.faces = faces or []
        self.config = config or {}

    def set_nodes(self, nodes: List[Dict]) -> "Sight":
        """Set graph nodes"""
        self.nodes = nodes
        return self

    def set_links(self, links: List[Dict]) -> "Sight":
        """Set graph links"""
        self.links = links
        return self

    def set_faces(self, faces: List[Tuple[Any, Any, Any]]) -> "Sight":
        """A face is a triple of nodeIds"""
        self.faces = [
            {"nodes": list(f), "id": f"face-{i}"} for i, f in enumerate(faces)
        ]
        return self

    def set_config(self, config: Dict[str, Any]) -> "Sight":
        """Update configuration (merges with existing)"""
        self.config.update(config)
        return self

    def set_graph_type(self, graph_type: str) -> "Sight":
        """Switch between 2D and 3D"""
        if graph_type not in ["2D", "3D"]:
            raise ValueError("graph_type must be '2D' or '3D'")
        self.graph_type = graph_type
        return self

    def get_data(self) -> Dict[str, Any]:
        """Get data for API"""
        return {
            "graphType": self.graph_type,
            "data": {
                "nodes": self.nodes,
                "links": self.links,
                "faces": self.faces,
            },
            "config": self.config,
        }

    def show(self, port: int = 5050):
        """Display in browser"""
        from .server import run_server

        run_server(self, port)

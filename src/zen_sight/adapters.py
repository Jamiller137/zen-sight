from zen_sight import Sight
import networkx as nx
from zen_mapper.types import MapperResult


def vis_nx(
    G: nx.Graph,
    rel_size: float = 3,
    link_color: str = "#000000",
    link_width: float = 2,
    bg_color: str = "#f2f2f2",
    port: int = 5050,
):

    nodes = []
    links = []
    for i in G.nodes:
        nodes.append(
            {
                "id": i,
                "name": f"{i}",
            }
        )

    for edge in G.edges:
        links.append(
            {
                "source": edge[0],
                "target": edge[1],
            }
        )

    sight = Sight()

    sight.set_nodes(nodes)
    sight.set_links(links)
    sight.set_config(
        {
            "nodeRelSize": rel_size,
            "nodeLabel": "name",
            "linkColor": link_color,
            "linkWidth": link_width,
            "backgroundColor": bg_color,
            "linkOpacity": 1,
            "nodeOpacity": 1,
        }
    )
    sight.show(port=port)


def vis_zen_mapper(result: MapperResult, port: int = 5050):
    nodes = []
    links = []
    faces = []

    for i in result.nerve[0]:
        nodes.append(
            {
                "id": f"{i[0]}",
                "name": f"Node {i[0]}",
            }
        )
    for edge in result.nerve[1]:
        links.append(
            {
                "source": f"{edge[0]}",
                "target": f"{edge[1]}",
            }
        )

    for face in result.nerve[2]:
        faces.append(face)

    sight = Sight()

    sight.set_nodes(nodes)
    sight.set_links(links)
    sight.set_faces(faces)

    sight.set_config(
        {
            "nodeAutoColorBy": "group",
            "nodeRelSize": 4,
            "nodeOpacity": 1,
            "nodeLabel": "name",
            "linkColor": "#000000",
            "linkWidth": 1,
            "linkOpacity": 1,
            "backgroundColor": "#f2f2f2",
            # Simplex appearance: alpha is for 2D version and will be ignored
            # in favor of faceOpacity for 3D
            "faceFillColor": "rgba(52, 152, 219, 0.3)",
            "faceStrokeColor": "rgba(52, 152, 219, 0.5)",
            "faceStrokeWidth": 1,
            "faceOpacity": 0.3,
        }
    )
    sight.show(port=port)

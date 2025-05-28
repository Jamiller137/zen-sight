from zen_sight import Sight
import networkx as nx

def vis_nx(
        G: nx.Graph, 
        rel_size: float = 3, 
        link_color: str = "#000000", 
        link_width: float = 2, 
        bg_color: str = "#f2f2f2",
        port: int = 5050):

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


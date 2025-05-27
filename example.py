"""Example showing customization options"""

from zen_sight import Sight
import math

def gradient_color_example():

    sight = Sight(graph_type="3D")

    nodes = []
    node_count = 100

    for i in range(node_count):
        metric = i / node_count

        r = int(255 * metric)
        g = 0
        b = int(255 * (1 - metric))
        color = f"#{r:02x}{g:02x}{b:02x}"

        # Can set starting positions
        # Can embedd html
        angle = i * 0.5
        radius = 5 + i * 0.3

        nodes.append({
            "id": i,
            "name": f"Node {i}",
            "desc": f"Node {i} <br/> value = {5 + metric * 20:.2f}",
            "metric": metric,
            "color": color,
            "value": 5 + metric * 20,
            "x": radius * math.cos(angle),
            "y": radius * math.sin(angle),
            "z": i * 0.5
        })

    links = []
    for i in range(node_count - 1):
        links.append({
            "source": i,
            "target": i + 1,
            "value": 2
        })
        # Add hexagonal cross section
        if i < node_count - 6:
            links.append({
                "source": i,
                "target": i + 6,
                "value": 5
            })

    sight.set_nodes(nodes).set_links(links)

    sight.set_config({
        "nodeColor": "color",
        "nodeVal": "value",
        "nodeLabel": "desc",
        "nodeOpacity": 1,
        "linkOpacity": 1,
        "backgroundColor": "#ffffff",
        "linkColor": "#000000",
        "linkWidth": "value"
    })

    sight.show(port=5051)

if __name__ == "__main__":
    gradient_color_example()


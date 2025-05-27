from zen_sight import Sight


def create_simplicial_complex():
    """Create a graph with 2-simplices"""

    # nodes in a hexagonal pattern
    nodes = []
    positions = [
        (0, 0),
        (1, 0),
        (0.5, 0.87),
        (-0.5, 0.87),
        (-1, 0),
        (-0.5, -0.87),
        (0.5, -0.87),
    ]

    for i, (x, y) in enumerate(positions):
        nodes.append(
            {
                "id": i,
                "name": f"Node {i} <br> {'center' if i == 0 else 'outer'}",
                "x": x * 50,
                "y": y * 50,
                "z": 0,
                "group": "center" if i == 0 else "outer",
            }
        )

    links = []
    # connect center to all others
    for i in range(1, 7):
        links.append({"source": 0, "target": i})

    # connect outer nodes
    for i in range(1, 7):
        next_i = (i % 6) + 1
        links.append({"source": i, "target": next_i})

    faces = [
        (0, 1, 2),  # center with each adjacent pair in outer ring
        (0, 2, 3),
        (0, 3, 4),
        (0, 4, 5),
        (0, 5, 6),
        (0, 6, 1),
    ]

    return nodes, links, faces


def main():
    sight = Sight(graph_type="2D")

    nodes, links, faces = create_simplicial_complex()

    sight.set_nodes(nodes)
    sight.set_links(links)
    sight.set_faces(faces)

    sight.set_config(
        {
            "nodeAutoColorBy": "group",
            "nodeRelSize": 4,
            "nodeLabel": "name",
            "linkColor": "#000000",
            "linkWidth": 2,
            "backgroundColor": "#ffffff",
            # Simplex appearance: alpha is for 2D version and will be ignored
            # in favor of faceOpacity for 3D
            "faceFillColor": "rgba(52, 152, 219, 0.3)",
            "faceStrokeColor": "rgba(52, 152, 219, 0.5)",
            "faceStrokeWidth": 1,
            "faceOpacity": 0.3,
        }
    )
    sight.show()


if __name__ == "__main__":
    main()

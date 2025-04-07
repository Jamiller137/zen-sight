from networkx import edges
from zen_mapper import mapper
from zen_mapper.cover import Width_Balanced_Cover
from src.zen_sight import SimplexTreeVisualizer
from sklearn.cluster import DBSCAN
from zen_mapper.cluster import sk_learn
import numpy as np
from matplotlib.pyplot import get_cmap

def create_klein_bottle(n_points=20000, noise_level=0.05):
    u = 2 * np.pi * np.random.rand(n_points)
    v = 2 * np.pi * np.random.rand(n_points)

    u_noisy = u + noise_level * np.random.randn(n_points)
    v_noisy = v + noise_level * np.random.randn(n_points)

    x = (2 + np.cos(u_noisy/2) * np.sin(v_noisy) - np.sin(u_noisy/2) * np.sin(2*v_noisy)) * np.cos(u_noisy)
    y = (2 + np.cos(u_noisy/2) * np.sin(v_noisy) - np.sin(u_noisy/2) * np.sin(2*v_noisy)) * np.sin(u_noisy)
    z = np.sin(u_noisy/2) * np.sin(v_noisy) + np.cos(u_noisy/2) * np.sin(2*v_noisy)
    w = np.cos(v_noisy)

    klein_bottle = np.column_stack((x, y, z, w))

    return klein_bottle, u/np.pi - 1, v/np.pi - 1  # Return the points and parameterization variables (normalized to [-1,1])

def value_to_hex_color(value:float, min_val=-1.0, max_val=1.0, colormap='viridis'):
    if max_val == min_val:
        normalized = 0.5
    if not value:
        return min_val
    else:
        normalized = (value - min_val) / (max_val - min_val)
    # in case input min and max are incorrect
    normalized = max(0, min(1, normalized))

    cmap = get_cmap(colormap)

    rgb = cmap(normalized)[:3]

    r, g, b = [int(val * 255) for val in rgb]

    hex_color = (r << 16) | (g << 8) | b

    return hex_color

if __name__ == '__main__':
    dataset, u_param, v_param = create_klein_bottle(noise_level=0.05)
    projection = dataset[:,:2]
    coverer = Width_Balanced_Cover(n_elements=20, percent_overlap=0.4)

    result = mapper(
        data=dataset,
        projection=projection,
        cover_scheme=coverer,
        clusterer=sk_learn(DBSCAN(eps=.5)),
        min_intersection=1,
        dim=2
    )

    nodes = result.nodes
    simplex_tree = result.nerve
    viz = SimplexTreeVisualizer(simplex_tree, max_dim=2)

    viz.set_default_materials(
        material_defaults = {
            "vertices": {
                "color": 0x005ebb,
                "size": 2,
                "opacity": 0.0001,
            },
            "edges": {
                "color": 0x000001, #black
                "width": 1,
                "opacity": 0.2,
                "dashed": False,
            },
            "faces": {
                "color": 0x3366CC,
                "opacity": .2,
            },
            "tetrahedra": {
                "color": 0x000001,
                "opacity": 0.8,
            }
        })

    # Identify regions to highlight based on u and v
    u_parameter_vertices = set()
    v_parameter_vertices = set()

    # Dictionaries to store vertex properties
    vertex_colors = {}
    vertex_sizes = {}

    # Store red and green edges
    red_edges = []
    green_edges = []

    for i in range(len(nodes)):
        data_indices = nodes[i]
        cluster_data = dataset[data_indices]

        # Get average parameter values
        avg_u_value = np.average(u_param[data_indices])
        avg_v_value = np.average(v_param[data_indices])

        # Choose coloring
        vertex_color = 0x111111
        vertex_colors[i] = vertex_color
        vertex_sizes[i] = int(15 + len(cluster_data)/10)

        # Track vertices in u-range
        if 0 < avg_u_value < 0.1:
            u_parameter_vertices.add(i)

        # Track vertices in v-range
        if -0.05 < avg_v_value< 0.25:
            v_parameter_vertices.add(i)

        viz.set_vertex_material(
            vertex_id=i,
            material_props={
                "color": vertex_color,
                "size": vertex_sizes[i],
                "opacity": 0.0001  # Default low opacity
            }
        )

    # Process edges first
    edges = simplex_tree.get_simplices(dim=1)

    # Track vertices that are part of special edges
    red_vertices = set()
    green_vertices = set()
    dual_vertices = set()  # both red and green

    for edge in edges:
        source, target = edge[0], edge[-1]
        u_connection = len(list(set(edge) & u_parameter_vertices))
        v_connection = len(list(set(edge) & v_parameter_vertices))

        if u_connection == 2:
            red_edges.append(edge)
            for v in edge:
                if v in green_vertices:
                    dual_vertices.add(v)
                red_vertices.add(v)

            viz.set_edge_material(source_id=source, target_id=target,
                                material_props={
                                    "color": 0xFF0000,
                                    "opacity": 1,
                                    "dashed": False,
                                })

        elif v_connection == 2:
            green_edges.append(edge)
            for v in edge:
                if v in red_vertices:
                    dual_vertices.add(v)
                green_vertices.add(v)

            viz.set_edge_material(source_id=source, target_id=target,
                                material_props={
                                    "color": 0x00FF00,  # green
                                    "opacity": 1,
                                    "dashed": False
                                })
        else:
            # Make other edges less visible
            viz.set_edge_material(source_id=source, target_id=target,
                                material_props={
                                    "opacity": 0.01,
                                })

    # update vertex colors
    for vertex in red_vertices - dual_vertices:
        viz.set_vertex_material(
            vertex_id=vertex,
            material_props={
                "color": 0xFF0000,  # bright red
                "opacity": 1.0,
                "size": vertex_sizes.get(vertex, 15)
            }
        )

    for vertex in green_vertices - dual_vertices:
        viz.set_vertex_material(
            vertex_id=vertex,
            material_props={
                "color": 0x00FF00,  # bright green
                "opacity": 1.0,
                "size": vertex_sizes.get(vertex, 15)
            }
        )

    # yellow for vertices connected to both red and green edges
    for vertex in dual_vertices:
        viz.set_vertex_material(
            vertex_id=vertex,
            material_props={
                "color": 0xFFFF00,  # yellow
                "opacity": 1.0,
                "size": vertex_sizes.get(vertex, 15)
            }
        )

    # Process faces
    faces = simplex_tree.get_simplices(dim=2)
    for face in faces:
        # change faces if they connect to a highlighted vertex
        if (list(set(face) & u_parameter_vertices) or 
            list(set(face) & v_parameter_vertices)):
            viz.set_face_material(vertex_ids=face, material_props={
                "opacity": .2,
            })

    # Run the visualization
    print("\nLaunching visualization with material customizations...")
    viz.show(port=5000)

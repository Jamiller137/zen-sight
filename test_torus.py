from zen_mapper import mapper
from zen_mapper.cover import Width_Balanced_Cover
from src.zen_sight import SimplexTreeVisualizer
from sklearn.cluster import DBSCAN
from zen_mapper.cluster import sk_learn
import numpy as np
from matplotlib.pyplot import get_cmap

def create_torus(n_points=5000, R=3.0, r=1.0, noise_level=0.05):

    theta = 2 * np.pi * np.random.rand(n_points)
    phi = 2 * np.pi * np.random.rand(n_points)

    R_noisy = R + noise_level * np.random.randn(n_points)
    r_noisy = r + noise_level * np.random.randn(n_points)

    x = (R_noisy + r_noisy * np.cos(theta)) * np.cos(phi)
    y = (R_noisy + r_noisy * np.cos(theta)) * np.sin(phi)
    z = r_noisy * np.sin(theta)

    torus = np.column_stack((x, y, z))
    return torus

def value_to_hex_color(value:float, min_val=-1.0, max_val=1.0, colormap='viridis'):
    # written so I can copy paste in other examples
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

    dataset = create_torus()
    projection = np.column_stack((dataset[:,0], dataset[:,2]))
    coverer = Width_Balanced_Cover(n_elements=5, percent_overlap=0.3)

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
    viz = SimplexTreeVisualizer(simplex_tree, max_dim=3)
    print(dataset[0])
    viz.set_default_materials(
        material_defaults = {
            "vertices": {
                "color": 0x005ebb, #blue
                "size": 15,
                "opacity": 1,
            },
            "edges": {
                "color": 0x000001, #black
                "width": 1, #width doesnt work!
                "opacity": 1,
                "dashed": False,
            },
            "faces": {
                "color": 0x3366CC, #red
                "opacity": 0.4,
            },
            "tetrahedra": {
                "color": 0x000001,
                "opacity": 0.8,
            }
        })
    
    for i in range(len(nodes)):
        data_indices = nodes[i]
        cluster_data = dataset[data_indices]
        avg_x_value = np.average(cluster_data[:,0])
        avg_y_value = np.average(cluster_data[:,1])
        avg_z_value = np.average(cluster_data[:,2])
        avg_phi_value = np.arctan2(avg_y_value, avg_x_value)
        vertex_color = value_to_hex_color(value=avg_z_value, min_val=-1, max_val=1)
        viz.set_vertex_material(
            vertex_id=i,
            material_props={
                "color": vertex_color,
                "size": 15
            }
        )


    # Run the visualization
    print("\nLaunching visualization with material customizations...")
    viz.show(port=5000)

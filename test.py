from zen_mapper.simplex import SimplexTree
from src.zen_sight import SimplexTreeVisualizer

# Create a custom simplicial complex using zen-mapper's SimplexTree
def create_test_complex():
    st = SimplexTree()

    # Add vertices
    for i in range(8):
        st.insert([i])

    # Add edges
    edges = [
        [0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3]
    ]
    for edge in edges:
        st.insert(edge)

    # Add faces
    faces = [
        [0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]  # Four faces of a tetrahedron
    ]
    for face in faces:
        st.insert(face)

    # Add a tetrahedron (3-simplex)
    st.insert([4, 5, 6, 7])

    # Add non-simplicial complex pieces
    st.insert([24, 25, 26, 27])
    st.insert([34, 35, 36])
    st.insert([44, 45])

    edges = [
        [4, 5], [4, 6], [5, 6], [4, 7], [5, 7], [6, 7]
    ]
    for edge in edges:
        st.insert(edge)

    faces = [
        [4, 5, 6], [4, 5, 7], [4, 6, 7], [5, 6, 7]
    ]
    for face in faces:
        st.insert(face)

    return st


if __name__ == '__main__':

    simplex_tree = create_test_complex()

    # Print information about the complex
    print("Simplicial Complex Structure:")
    print(f"Vertices: {len(simplex_tree.get_simplices(dim=0))}")
    print(f"Edges: {len(simplex_tree.get_simplices(dim=1))}")
    print(f"Triangular faces: {len(simplex_tree.get_simplices(dim=2))}")
    print(f"Tetrahedra: {len(simplex_tree.get_simplices(dim=3))}")

    # Initialize the visualizer with max_dim=3 to include tetrahedra
    viz = SimplexTreeVisualizer(simplex_tree, max_dim=3)

    # Set default materials for all elements
    viz.set_default_materials({
        "vertices": {
            "color": 0x000000,
            "size": 5
        },
        "edges": {
            "color": 0x005ebb,
            "width": 3,
            "opacity": 0.8,
            "dashed": True,
        },
        "faces": {
            "color": 0x3366CC,
            "opacity": 0.4
        },
        "tetrahedra": {
            "color": 0x222222,
            "opacity": 0.8
        }
    })

    # Customize vertex
    viz.set_vertex_material(0, {
        "color": 0xFF0000,  # Red
        "size": 15,
        "shape": "cylinder"
    })

    # Run the visualization
    print("\nLaunching visualization with material customizations...")
    viz.show(port=5000)

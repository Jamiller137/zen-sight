import json
from flask import Flask, render_template
from ..utils.encoders import NumpyEncoder

def create_visualization_server(visualization_data):
    """
    Create a Flask server for the 3D visualization.

    Parameters
    ----------
    visualization_data : dict
        Data for the visualization, including vertices, edges, faces, and tetrahedra.

    Returns
    -------
    app : Flask
        Flask application instance
    """
    app = Flask(__name__, static_folder='../static', template_folder='../templates')

    @app.route("/")
    def index():
        return render_template(
            "3d_base.html",
            title="SimplexTree Visualization",
            graph_data=json.dumps(visualization_data, cls=NumpyEncoder),
        )

    return app

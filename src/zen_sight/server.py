"""Flask server for the visualization"""

import os
from pathlib import Path
import webbrowser
import threading
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS


def create_app(sight_instance):
    static_folder = Path(__file__).parent / 'static'

    app = Flask(__name__, 
                static_folder=str(static_folder),
                static_url_path='')
    CORS(app)

    static_path = str(static_folder)

    @app.route('/')
    def index():
        return send_from_directory(static_path, 'index.html')

    @app.route('/<path:path>')
    def static_files(path):
        if path and os.path.exists(os.path.join(static_path, path)):
            return send_from_directory(static_path, path)
        else:
            # Fallback
            return send_from_directory(static_path, 'index.html')

    @app.route('/api/graph-data')
    def get_graph_data():
        return jsonify(sight_instance.get_data())

    @app.route('/api/update-config', methods=['POST'])
    def update_config():
        config = request.json
        sight_instance.set_config(config)
        return jsonify(sight_instance.get_data())

    @app.route('/api/set-type/<graph_type>')
    def set_graph_type(graph_type):
        sight_instance.set_graph_type(graph_type)
        return jsonify(sight_instance.get_data())

    return app


def run_server(sight_instance, port=5050):
    """Run the visualization server"""
    app = create_app(sight_instance)

    # auto open browser
    url = f'http://localhost:{port}'
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    print(f"Zen Sight running at {url}")
    print("Press Ctrl+C to stop")

    app.run(port=port, debug=False)


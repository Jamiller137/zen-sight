import webbrowser
import threading
import json
import uuid
from datetime import datetime
from pathlib import Path
import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS


def create_app(sight_instance):
    static_folder = Path(__file__).parent / "static"

    app = Flask(__name__, static_folder=str(static_folder), static_url_path="")
    CORS(app)

    static_path = str(static_folder)

    # store operations instead of full states (caused issues)
    operations_history = []
    initial_graph_data = None

    @app.route("/")
    def index():
        return send_from_directory(static_path, "index.html")

    @app.route("/<path:path>")
    def static_files(path):
        if path and os.path.exists(os.path.join(static_path, path)):
            return send_from_directory(static_path, path)
        else:
            return send_from_directory(static_path, "index.html")

    @app.route("/api/graph-data")
    def get_graph_data():
        nonlocal initial_graph_data
        data = sight_instance.get_data()
        if initial_graph_data is None:
            initial_graph_data = {
                "nodes": json.loads(json.dumps(data["data"]["nodes"])),
                "links": json.loads(json.dumps(data["data"]["links"])),
                "faces": json.loads(json.dumps(data["data"].get("faces", []))),
            }
        return jsonify(data)

    @app.route("/api/update-config", methods=["POST"])
    def update_config():
        config = request.json
        sight_instance.set_config(config)
        return jsonify(sight_instance.get_data())

    @app.route("/api/set-type/<graph_type>")
    def set_graph_type(graph_type):
        sight_instance.set_graph_type(graph_type)
        return jsonify(sight_instance.get_data())

    @app.route("/api/save-operation", methods=["POST"])
    def save_operation():
        try:
            operation_data = request.json

            operation_entry = {
                "id": str(uuid.uuid4()),
                "timestamp": operation_data.get(
                    "timestamp", datetime.now().isoformat()
                ),
                "type": operation_data.get("type", "unknown"),
                "description": operation_data.get("description", "Unknown operation"),
                "data": operation_data.get("data", {}),
            }

            operations_history.append(operation_entry)

            # only keep last 100 operations
            if len(operations_history) > 100:
                operations_history.pop(0)

            return jsonify({"success": True, "operationId": operation_entry["id"]})

        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @app.route("/api/operations-history")
    def get_operations_history():
        try:
            simplified_history = []
            for i, operation in enumerate(operations_history):
                simplified_history.append(
                    {
                        "id": operation["id"],
                        "index": i,
                        "timestamp": operation["timestamp"],
                        "type": operation["type"],
                        "description": operation["description"],
                    }
                )

            return jsonify({"history": simplified_history})

        except Exception as e:
            return jsonify({"history": [], "error": str(e)}), 500

    @app.route("/api/replay-to-operation/<int:operation_index>")
    def replay_to_operation(operation_index):
        try:
            if initial_graph_data is None:
                return jsonify({"error": "No initial graph data available"}), 400

            # start with initial graph data (deep copy to preserve colors)
            current_graph = {
                "nodes": json.loads(json.dumps(initial_graph_data["nodes"])),
                "links": json.loads(json.dumps(initial_graph_data["links"])),
                "faces": json.loads(json.dumps(initial_graph_data["faces"])),
            }

            affected_nodes_colors = {}

            # Replay operations up to the index
            for i in range(min(operation_index + 1, len(operations_history))):
                operation = operations_history[i]
                current_graph, affected_nodes_colors = apply_operation(
                    current_graph, operation, affected_nodes_colors
                )

            return jsonify({"graph": current_graph})

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def apply_operation(graph_data, operation, affected_nodes_colors):
        """Apply a single operation to graph data while preserving colors"""
        if operation["type"] == "cut_nodes":
            node_ids_to_cut = set(operation["data"]["nodeIds"])
            cut_color = operation["data"].get("cutColor", "#ff6969")
            affected_node_ids = set(operation["data"].get("affectedNodeIds", []))

            for node_id in affected_node_ids:
                affected_nodes_colors[node_id] = cut_color

            graph_data["nodes"] = [
                node
                for node in graph_data["nodes"]
                if node["id"] not in node_ids_to_cut
            ]

            for node in graph_data["nodes"]:
                if node["id"] in affected_nodes_colors:
                    node["color"] = affected_nodes_colors[node["id"]]

            graph_data["links"] = [
                link
                for link in graph_data["links"]
                if (
                    link["source"] not in node_ids_to_cut
                    and link["target"] not in node_ids_to_cut
                )
            ]

            graph_data["faces"] = [
                face
                for face in graph_data["faces"]
                if not any(node_id in node_ids_to_cut for node_id in face["nodes"])
            ]

        elif operation["type"] == "toggle_graph_type":
            pass

        # don't forget to add more operation types later

        return graph_data, affected_nodes_colors

    return app


def run_server(sight_instance, port=5050):
    """Run the visualization server"""
    app = create_app(sight_instance)

    # auto open browser
    url = f"http://localhost:{port}"
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    print(f"Zen Sight running at {url}")
    print("Press Ctrl+C to stop")

    app.run(port=port, debug=False)

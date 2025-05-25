from flask import Flask, jsonify
from flask_cors import CORS
import networkx as nx
import json


app = Flask(__name__)
CORS(app) # for react frontend

class GraphProcessor:
    def __init__(self):
        self.graph = nx.Graph()

    def create_sample_graph(self):
        nodes = [
            {"id": "1", "name": "Node 1"},
            {"id": "2", "name": "Node 2"},
            {"id": "3", "name": "Node 3"},
            {"id": "4", "name": "Node 4"},
            {"id": "5", "name": "Node 5"},
        ]

        links = [
            {"source": "1", "target": "2"},
            {"source": "2", "target": "3"},
            {"source": "3", "target": "1"},
        ]

        return {"nodes": nodes, "links": links}

    def process_complex_data(self):
        # placeholder
        print("placeholder")



processor = GraphProcessor

@app.route('/api/graph-data')
def get_graph_data():
    "API to serve data to react"
    graph_data = processor.create_sample_graph(None)
    return jsonify(graph_data)

@app.route('/api/process', methods=['POST'])
def process_data():
    "handle dataprocessing"
    return "placeholder"

if __name__ == '__main__':
    app.run(debug=True, port=5000)

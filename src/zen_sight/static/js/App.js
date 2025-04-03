import DataProcessor from './services/DataProcessor.js';
import Graph from './components/complex/Graph.js';
import Faces from './components/complex/Faces.js';
import Tetrahedra from './components/complex/Tetrahedra.js';

class App {
    constructor(data) {
        console.log("Initializing app...");
        this.container = document.getElementById('graph-container');
        this.init(data);

        // Start the animation loop
        this.animate();
    }

    init(data) {
        try {
            // Create graph instance
            const graphComponent = new Graph(this.container);
            graphComponent.initialize();

            // Store the graph component for later
            this.graphComponent = graphComponent;

            const processedData = DataProcessor.processGraphData(data);

            // Set the nodes and links to the graph
            graphComponent.setData({
                nodes: processedData.nodes,
                links: processedData.links
            });

            // Create and initialize face renderer if faces exist
            if (processedData.faces && processedData.faces.length > 0) {

                this.facesComponent = new Faces(graphComponent);
                this.facesComponent.setData(processedData);

                console.log("Faces initialized with", processedData.faces.length, "faces");
            }

            if (processedData.tetrahedra && processedData.tetrahedra.length > 0) {
                // Create the tetrahedra component with just graphComponent
                this.tetrahedraComponent = new Tetrahedra(graphComponent);
                this.tetrahedraComponent.setData(processedData);
            
                console.log("Tetrahedra initialized with", processedData.tetrahedra.length, "tetrahedra");
            }

        } catch (error) {
            console.error("Error initializing graph:", error);
        }
    }

    // Animation loop continuously updates faces
    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Update the faces and tetrahedra components
        if (this.facesComponent) {
            this.facesComponent.update();
        }
        if (this.tetrahedraComponent) {
            this.tetrahedraComponent.update();
        }
    }
}

// Make globally available
window.App = App;
export default App;

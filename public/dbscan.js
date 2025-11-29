// This will be the DBSCAN implementation.

window.DBSCAN = (() => {
    const startBtn = document.getElementById('start-btn');
    const epsilonValueInput = document.getElementById('epsilon-value');
    const minPtsValueInput = document.getElementById('min-pts-value');
    const completionMessage = document.getElementById('completion-message');

    const SEED = 'unsupervised-learning-viz';

    let svg, data, xScale, yScale;
    let visualizationInProgress = false;

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const noiseColor = "#555";

    function initializePlot(numPoints) {
        visualizationInProgress = false;
        Math.seedrandom(SEED);

        const plot = window.Plot.initialize('plot');
        svg = plot.svg;
        xScale = plot.xScale;
        yScale = plot.yScale;

        const shape = document.getElementById("shape-type").value;
        data = window.Shapes.generateDataByShape(shape, numPoints);

        drawPoints(data);

        startBtn.disabled = false;
        completionMessage.classList.add('hidden');
    }

    function drawPoints(points) {
        svg.selectAll(".point").remove();
        svg.selectAll(".point")
            .data(points)
            .enter().append("circle")
            .attr("class", "point")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 6)
            .style("fill", noiseColor)
            .style("stroke", "#000")
            .style("stroke-width", 1.5);
    }

    function euclideanDistance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    function regionQuery(pointIndex, epsilon) {
        const neighbors = [];
        for (let i = 0; i < data.length; i++) {
            if (i !== pointIndex && euclideanDistance(data[pointIndex], data[i]) < epsilon) {
                neighbors.push(i);
            }
        }
        return neighbors;
    }
    
    function startVisualization() {
        if (visualizationInProgress) return;
        visualizationInProgress = true;
        startBtn.disabled = true;

        const epsilon = parseFloat(epsilonValueInput.value);
        const minPts = parseInt(minPtsValueInput.value, 10);
        
        const { clusters, noise } = dbscan(epsilon, minPts);

        visualizeClusters(clusters, noise);

        completionMessage.textContent = `DBSCAN found ${clusters.length} clusters.`;
        completionMessage.classList.remove('hidden');
        visualizationInProgress = false;
    }

    function dbscan(epsilon, minPts) {
        const clusters = [];
        const visited = new Array(data.length).fill(false);
        const cluster = new Array(data.length).fill(0); // 0 = unclassified
        let clusterId = 0;

        for (let i = 0; i < data.length; i++) {
            if (visited[i]) continue;
            visited[i] = true;

            const neighbors = regionQuery(i, epsilon);

            if (neighbors.length < minPts) {
                cluster[i] = -1; // -1 = noise
            } else {
                clusterId++;
                expandCluster(i, neighbors, clusterId, epsilon, minPts, visited, cluster);
            }
        }
        
        // Group points by clusterId
        const finalClusters = [];
        const noise = [];
        for(let i=1; i<=clusterId; i++){
            const currentCluster = [];
            for(let j=0; j<data.length; j++){
                if(cluster[j] === i){
                    currentCluster.push(data[j]);
                }
            }
            finalClusters.push(currentCluster);
        }

        for(let j=0; j<data.length; j++){
            if(cluster[j] === -1){
                noise.push(data[j]);
            }
        }

        return { clusters: finalClusters, noise };
    }

    function expandCluster(pointIndex, neighbors, clusterId, epsilon, minPts, visited, cluster) {
        cluster[pointIndex] = clusterId;
        let queue = [...neighbors];
        
        while(queue.length > 0) {
            const currentPointIndex = queue.shift();
            
            if (!visited[currentPointIndex]) {
                visited[currentPointIndex] = true;
                const currentNeighbors = regionQuery(currentPointIndex, epsilon);

                if (currentNeighbors.length >= minPts) {
                    queue = queue.concat(currentNeighbors);
                }
            }

            if (cluster[currentPointIndex] === 0) { // Not yet part of any cluster
                cluster[currentPointIndex] = clusterId;
            }
        }
    }

    function visualizeClusters(clusters, noise) {
        svg.selectAll(".point")
            .transition().duration(500)
            .style("fill", (d) => {
                for(let i=0; i<clusters.length; i++) {
                    if (clusters[i].includes(d)) {
                        return colorScale(i);
                    }
                }
                if (noise.includes(d)) {
                    return noiseColor;
                }
                return colorScale(d.cluster);
            });
    }
    
    return {
        initializePlot,
        startVisualization
    };
})();

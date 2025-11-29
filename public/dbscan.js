// This will be the DBSCAN implementation.

window.DBSCAN = (() => {
    const startBtn = document.getElementById('start-btn');
    const epsilonValueInput = document.getElementById('epsilon-value');
    const minPtsValueInput = document.getElementById('min-pts-value');
    const completionMessage = document.getElementById('completion-message');
    const nextStepBtn = document.getElementById('next-step-btn');

    const SEED = 'unsupervised-learning-viz';

    let svg, data, xScale, yScale;
    let visualizationInProgress = false;
    let currentPointIndex = 0; // To track DBSCAN's current processing point
    let clusterIdCounter = 0; // To assign cluster IDs
    let visitedPoints = new Set(); // To keep track of visited points
    let pointStates = []; // To store the state of each point (UNVISITED, CORE, BORDER, NOISE)
    let pointClusterIds = []; // To store the cluster ID for each point
    let expandingQueue = []; // New: Queue for iterative cluster expansion
    let statusText = null; // Text element to show current step status

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    const noiseColor = "#555";
    const unvisitedColor = "#999"; // New color for unvisited points
    const corePointColor = "#FFD700"; // Gold color for core points
    const borderPointColor = "#87CEEB"; // Sky blue for border points

    function initializePlot(numPoints) {
        visualizationInProgress = false;
        Math.seedrandom(SEED);
        
        const plot = window.Plot.initialize('plot');
        svg = plot.svg;
        xScale = plot.xScale;
        yScale = plot.yScale;

        // Remove any existing status text
        svg.selectAll(".status-text").remove();
        
        // Create status text element in the top margin area (negative y to position above the plot)
        statusText = svg.append("text")
            .attr("class", "status-text")
            .attr("x", 10)
            .attr("y", -25) // Position in the top margin area, above the plot
            .style("fill", "#00ffff")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("");

        const shape = document.getElementById("shape-type").value;
        data = window.Shapes.generateDataByShape(shape, numPoints);

        // Initialize states and cluster IDs
        pointStates = new Array(data.length).fill('UNVISITED');
        pointClusterIds = new Array(data.length).fill(0); // 0 means not assigned to any cluster
        visitedPoints.clear();
        currentPointIndex = 0;
        clusterIdCounter = 0;

        drawPoints(data);

        startBtn.disabled = false;
        // nextStepBtn will be enabled by script.js
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
            .style("fill", (d, i) => {
                // Priority: cluster color > state color
                if (pointClusterIds[i] !== 0) {
                    // Point belongs to a cluster - use cluster color
                    return colorScale(pointClusterIds[i] - 1);
                }
                // Point doesn't belong to a cluster - use state color
                if (pointStates[i] === 'UNVISITED') return unvisitedColor;
                if (pointStates[i] === 'NOISE') return noiseColor;
                if (pointStates[i] === 'CORE') return corePointColor;
                if (pointStates[i] === 'BORDER') return borderPointColor;
                return unvisitedColor;
            })
            .style("stroke", "#000")
            .style("stroke-width", 1.5);
    }

    function startVisualization() {
        if (visualizationInProgress) return;
        visualizationInProgress = true;
        startBtn.disabled = true;
        nextStepBtn.disabled = false; // Ensure next step button is enabled
        completionMessage.classList.add('hidden');

        // Reset states for a new visualization run
        pointStates.fill('UNVISITED');
        pointClusterIds.fill(0);
        visitedPoints.clear();
        currentPointIndex = 0;
        clusterIdCounter = 0;
        expandingQueue = []; // Reset the expansion queue
        drawPoints(data); // Redraw with unvisited state

        performNextStep(); // Start the first step automatically
    }

    async function performNextStep() {
        if (!visualizationInProgress) return;
        
        // If there's an active cluster expansion, continue it.
        if (expandingQueue.length > 0) {
            await continueExpandingCluster();
            return; // Exit after one step of expansion
        }

        // Clear previous step's visualization helpers (e.g., epsilon circle)
        svg.selectAll(".epsilon-circle").remove();
        svg.selectAll(".current-point-highlight").remove();
        svg.selectAll(".connection-line").remove();

        // Find the next unvisited point
        while (currentPointIndex < data.length && visitedPoints.has(currentPointIndex)) {
            currentPointIndex++;
        }

        if (currentPointIndex >= data.length) {
            // Algorithm finished
            visualizationInProgress = false;
            nextStepBtn.disabled = true; // Disable button when algorithm is complete
            svg.selectAll(".epsilon-circle").remove();
            svg.selectAll(".current-point-highlight").remove();
            if (statusText) {
                statusText.text(`Algorithm complete! Found ${clusterIdCounter} clusters.`);
            }
            completionMessage.textContent = `DBSCAN found ${clusterIdCounter} clusters.`;
            completionMessage.classList.remove('hidden');
            return;
        }

        const point = data[currentPointIndex];
        // Visited will be marked when processing the point below

        // Highlight the current point being processed
        svg.append("circle")
            .attr("class", "current-point-highlight")
            .attr("cx", xScale(point.x))
            .attr("cy", yScale(point.y))
            .attr("r", 10)
            .style("fill", "none")
            .style("stroke", "red")
            .style("stroke-width", 3);

        const epsilon = parseFloat(document.getElementById('epsilon-value').value);
        const minPts = parseInt(document.getElementById('min-pts-value').value, 10);

        // Visualize epsilon neighborhood
        svg.append("circle")
            .attr("class", "epsilon-circle")
            .attr("cx", xScale(point.x))
            .attr("cy", yScale(point.y))
            .attr("r", xScale(epsilon) - xScale(0)) // Convert epsilon from data units to pixel units
            .style("fill", "lightblue")
            .style("fill-opacity", 0.2)
            .style("stroke", "blue")
            .style("stroke-width", 1);

        const neighbors = regionQuery(currentPointIndex, epsilon);
        
        // Update status text
        if (statusText) {
            statusText.text(`Evaluating point ${currentPointIndex + 1}: Found ${neighbors.length} neighbors (need ${minPts} for core point)`);
        }

        // Mark point as visited as it's now being processed
        visitedPoints.add(currentPointIndex);

        if (neighbors.length >= minPts) {
            // This is a core point, start/continue cluster expansion
            pointStates[currentPointIndex] = 'CORE';
            clusterIdCounter++;
            pointClusterIds[currentPointIndex] = clusterIdCounter;
            expandingQueue = [...neighbors]; // Initialize queue for expansion
            if (statusText) {
                statusText.text(`Point ${currentPointIndex + 1} is a CORE point! Starting cluster ${clusterIdCounter} with ${neighbors.length} neighbors.`);
            }
        } else {
            // Mark as noise for now, might become a border point later
            pointStates[currentPointIndex] = 'NOISE';
            if (statusText) {
                statusText.text(`Point ${currentPointIndex + 1} is NOISE (only ${neighbors.length} neighbors, need ${minPts}).`);
            }
        }

        drawPoints(data); // Redraw points with updated states
    }

    async function continueExpandingCluster() {
        const epsilon = parseFloat(document.getElementById('epsilon-value').value);
        const minPts = parseInt(document.getElementById('min-pts-value').value, 10);
        const currentClusterId = clusterIdCounter; // The cluster being expanded

        if (expandingQueue.length === 0) {
            // Expansion finished for this cluster, return control to main loop
            // Clear any remaining visualization elements
            svg.selectAll(".epsilon-circle").remove();
            svg.selectAll(".current-point-highlight").remove();
            svg.selectAll(".connection-line").remove();
            if (statusText) {
                statusText.text(`Cluster ${currentClusterId} expansion complete. Moving to next unvisited point.`);
            }
            currentPointIndex++; // Move to next point for main loop
            return; 
        }

        // Clear previous step's visualization helpers
        svg.selectAll(".epsilon-circle").remove();
        svg.selectAll(".current-point-highlight").remove();
        svg.selectAll(".connection-line").remove();

        const currentNeighborIndex = expandingQueue.shift();
        const currentNeighborPoint = data[currentNeighborIndex];

        // Highlight the current neighbor being processed
        svg.append("circle")
            .attr("class", "current-point-highlight")
            .attr("cx", xScale(currentNeighborPoint.x))
            .attr("cy", yScale(currentNeighborPoint.y))
            .attr("r", 10)
            .style("fill", "none")
            .style("stroke", "red")
            .style("stroke-width", 3);

        // Visualize epsilon neighborhood for this neighbor
        svg.append("circle")
            .attr("class", "epsilon-circle")
            .attr("cx", xScale(currentNeighborPoint.x))
            .attr("cy", yScale(currentNeighborPoint.y))
            .attr("r", xScale(epsilon) - xScale(0))
            .style("fill", "lightblue")
            .style("fill-opacity", 0.2)
            .style("stroke", "blue")
            .style("stroke-width", 1);

        if (visitedPoints.has(currentNeighborIndex)) {
            // If this point was visited and is unassigned or noise, assign it as border.
            // If it's already part of another cluster, do nothing.
            if (pointClusterIds[currentNeighborIndex] === 0 || pointStates[currentNeighborIndex] === 'NOISE') {
                pointClusterIds[currentNeighborIndex] = currentClusterId;
                pointStates[currentNeighborIndex] = 'BORDER';
                if (statusText) {
                    statusText.text(`Neighbor ${currentNeighborIndex + 1} was previously NOISE, now assigned as BORDER point of cluster ${currentClusterId}.`);
                }
            } else {
                if (statusText) {
                    statusText.text(`Neighbor ${currentNeighborIndex + 1} already belongs to another cluster. Skipping.`);
                }
            }
            drawPoints(data);
            return;
        }

        visitedPoints.add(currentNeighborIndex);
        pointClusterIds[currentNeighborIndex] = currentClusterId;
        pointStates[currentNeighborIndex] = 'BORDER'; // Assume border initially
        drawPoints(data);

        const nextNeighbors = regionQuery(currentNeighborIndex, epsilon);
        
        // Update status text
        if (statusText) {
            statusText.text(`Expanding cluster ${currentClusterId}: Evaluating neighbor ${currentNeighborIndex + 1} (${nextNeighbors.length} neighbors, need ${minPts} for core)`);
        }

        if (nextNeighbors.length >= minPts) {
            // This neighbor is a core point, add its unvisited neighbors to the queue for expansion
            pointStates[currentNeighborIndex] = 'CORE'; // Promote to core point
            const newNeighbors = [];
            for (const nnIndex of nextNeighbors) {
                if (!visitedPoints.has(nnIndex)) {
                    expandingQueue.push(nnIndex);
                    newNeighbors.push(nnIndex);
                }
            }
            if (statusText) {
                statusText.text(`Neighbor ${currentNeighborIndex + 1} is a CORE point! Added ${newNeighbors.length} new neighbors to expansion queue.`);
            }
            drawPoints(data);
        } else {
            if (statusText) {
                statusText.text(`Neighbor ${currentNeighborIndex + 1} is a BORDER point (${nextNeighbors.length} neighbors, need ${minPts} for core).`);
            }
        }
        // Small delay for visualization is handled by the `nextStepBtn` click event
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

    function expandClusterFast(pointIndex, neighbors, clusterId, epsilon, minPts) {
        let queue = [...neighbors];
        pointClusterIds[pointIndex] = clusterId;
        pointStates[pointIndex] = 'CORE';
        
        while (queue.length > 0) {
            const currentNeighborIndex = queue.shift();
            
            if (visitedPoints.has(currentNeighborIndex)) {
                if (pointClusterIds[currentNeighborIndex] === 0 || pointStates[currentNeighborIndex] === 'NOISE') {
                    pointClusterIds[currentNeighborIndex] = clusterId;
                    pointStates[currentNeighborIndex] = 'BORDER';
                }
                continue;
            }
            
            visitedPoints.add(currentNeighborIndex);
            pointClusterIds[currentNeighborIndex] = clusterId;
            pointStates[currentNeighborIndex] = 'BORDER';
            
            const nextNeighbors = regionQuery(currentNeighborIndex, epsilon);
            
            if (nextNeighbors.length >= minPts) {
                pointStates[currentNeighborIndex] = 'CORE';
                for (const nnIndex of nextNeighbors) {
                    if (!visitedPoints.has(nnIndex)) {
                        queue.push(nnIndex);
                    }
                }
            }
        }
    }

    async function fastForward() {
        // Reset any ongoing visualization
        visualizationInProgress = false;
        startBtn.disabled = true;
        nextStepBtn.disabled = true;
        completionMessage.classList.add('hidden');

        // Clear any existing visualization elements
        svg.selectAll(".epsilon-circle").remove();
        svg.selectAll(".current-point-highlight").remove();
        svg.selectAll(".connection-line").remove();
        if (statusText) {
            statusText.text("Running DBSCAN algorithm...");
        }

        // Reset states
        pointStates.fill('UNVISITED');
        pointClusterIds.fill(0);
        visitedPoints.clear();
        clusterIdCounter = 0;
        currentPointIndex = 0;
        expandingQueue = [];
        
        visualizationInProgress = true;

        const epsilon = parseFloat(epsilonValueInput.value);
        const minPts = parseInt(minPtsValueInput.value, 10);

        // Run DBSCAN algorithm to completion
        for (let i = 0; i < data.length; i++) {
            if (visitedPoints.has(i)) continue;
            
            visitedPoints.add(i);
            const neighbors = regionQuery(i, epsilon);
            
            if (neighbors.length < minPts) {
                pointStates[i] = 'NOISE';
            } else {
                clusterIdCounter++;
                expandClusterFast(i, neighbors, clusterIdCounter, epsilon, minPts);
            }
        }

        // Draw final result
        drawPoints(data);

        visualizationInProgress = false;
        if (statusText) {
            statusText.text(`Algorithm complete! Found ${clusterIdCounter} clusters.`);
        }
        completionMessage.textContent = `DBSCAN found ${clusterIdCounter} clusters.`;
        completionMessage.classList.remove('hidden');
        startBtn.disabled = false;
    }
    
    return {
        initializePlot,
        startVisualization,
        performNextStep,
        fastForward,
        isVisualizationInProgress: () => visualizationInProgress
    };
})();

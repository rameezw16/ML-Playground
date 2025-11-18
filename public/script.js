document.addEventListener('DOMContentLoaded', () => {
    const plotDiv = document.getElementById('plot');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const kValueInput = document.getElementById('k-value');
    const pointsValueInput = document.getElementById('points-value');
    const distanceMetricSelect = document.getElementById('distance-metric');
    const initMethodSelect = document.getElementById('init-method');
    const completionMessage = document.getElementById('completion-message');

    const SEED = 'reproducible-kmeans';
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = plotDiv.clientWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    let svg, data, centroids, clusters, xScale, yScale;
    let visualizationInProgress = false;
    let iterationCount = 0;

    
    const colorScale = d3.scaleOrdinal()
        .range(['#00ffff', '#ff00ff', '#ff4500', '#7fff00', '#ffd700', '#1e90ff']);

    pointsValueInput.addEventListener('input', () => {
        let value = parseInt(pointsValueInput.value, 10);
        if (value > 1000) 
            value = 1000;
        if (value < 1) 
            value = 1;
        pointsValueInput.value = value;
        });

    kValueInput.addEventListener('input', () => {
        let value = parseInt(kValueInput.value, 10);
        if (value > 10) 
            value = 10; 
        if (value < 1) 
            value = 1;   
        kValueInput.value = value;
    });
            
    function initializePlot() {
        visualizationInProgress = false;
        Math.seedrandom(SEED); // Reset random generator
        d3.select('#plot-svg').remove();

        svg = d3.select("#plot").append("svg")
            .attr("id", "plot-svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
        yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickSizeOuter(0))
            .selectAll("text").style("fill", "#e0e0e0");
        
        svg.append("g")
            .call(d3.axisLeft(yScale).tickSizeOuter(0))
            .selectAll("text").style("fill", "#e0e0e0");

        svg.append("g").attr("class", "hull-paths");

        const numPoints = parseInt(pointsValueInput.value, 10);
        const shape = document.getElementById("shape-type").value;
        data = generateDataByShape(shape, numPoints);

        drawPoints(data);

        startBtn.disabled = false;
        nextStepBtn.disabled = true;
        completionMessage.classList.add('hidden');
    }

    function generateRandomData(count) {
        return Array.from({ length: count }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100
        }));
    }

    function generateMoons(numPoints) {
        const points = [];
        const baseRadius = 20;     // main radius
        const thickness = 6;       // thickness of the moon band
        const offsetX = 40;        // horizontal shift to stay inside 100x100
        const offsetY = 45;        // vertical positioning
    
        function randomRadius() {
            return baseRadius + (Math.random() * thickness - thickness / 2);
        }
    
        // First Moon (upper arc)
        for (let i = 0; i < numPoints; i++) {
            const angle = Math.random() * Math.PI;
            const radius = randomRadius();
            const x = radius * Math.cos(angle) + offsetX;
            const y = radius * Math.sin(angle) + offsetY;
            points.push({ x, y });
        }
    
        // Second Moon (mirrored lower arc), shifted right
        for (let i = 0; i < numPoints; i++) {
            const angle = Math.random() * Math.PI;
            const radius = randomRadius();
            const x = radius * Math.cos(angle) + offsetX + 20;
            const y = -radius * Math.sin(angle) + offsetY;
            points.push({ x, y });
        }
    
        return points;
    }
    
    
    

function generateDoubleRing(count) {
    const result = [];
    const center = { x: 50, y: 50 };

    const outerRadius = 30;
    const innerRadius = 15;

    // Less noise = tighter ring
    const noise = 0.4;

    const half = Math.floor(count / 2);

    for (let i = 0; i < half; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = outerRadius + (Math.random() * noise - noise / 2);
        result.push({
            x: center.x + r * Math.cos(angle),
            y: center.y + r * Math.sin(angle)
        });
    }

    for (let i = 0; i < count - half; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = innerRadius + (Math.random() * noise - noise / 2);
        result.push({
            x: center.x + r * Math.cos(angle),
            y: center.y + r * Math.sin(angle)
        });
    }

    return result;
}


function generateGaussianBlobs(count) {
    const result = [];
    const numBlobs = Math.floor(Math.random() * 3) + 3; // 3–5 blobs
    const minDistance = 22; // minimum distance between blob centers
    const centers = [];

    function farEnough(x, y) {
        return centers.every(c => Math.hypot(c.x - x, c.y - y) >= minDistance);
    }

    // Pick spaced-apart centers
    while (centers.length < numBlobs) {
        const x = 15 + Math.random() * 70;
        const y = 15 + Math.random() * 70;
        if (farEnough(x, y)) {
            centers.push({ x, y });
        }
    }

    const stdDev = 4.5; // tighter clusters

    function gaussianRandom() {
        const u = Math.random();
        const v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    for (let i = 0; i < count; i++) {
        const c = centers[i % numBlobs];
        result.push({
            x: c.x + gaussianRandom() * stdDev,
            y: c.y + gaussianRandom() * stdDev
        });
    }
    return result;
}



    function generateSpiralData(count) {
        const points = [];
        const centerX = 50, centerY = 50; 
        const maxRadius = 40; 
        const maxAngle = 4 * Math.PI; 
        
        for (let i = 0; i < count; i++) {
            const t = i / count; 
            const angle = t * maxAngle;
            const r = t * maxRadius; 
            points.push({
                x: centerX + r * Math.cos(angle),
                y: centerY + r * Math.sin(angle)
            });
        }
        return points;
    }

    function generateDataByShape(shape, count) {
        switch (shape) {
            case "circle": return generateDoubleRing(count);
            case "moons": return generateMoons(count);
            case "spiral": return generateSpiralData(count);
            case "gaussian": return generateGaussianBlobs(count);
            default: return generateRandomData(count);
        }
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
            .style("fill", "#555")
            .style("stroke", "#000")
            .style("stroke-width", 1.5)
            .on("mouseover", function (event, d) {
                d3.select(this).transition().duration(100).attr("r", 9);
            })
            .on("mouseout", function (event, d) {
                d3.select(this).transition().duration(100).attr("r", 6);
            });
    }

    function drawCentroids(centroids) {
        svg.selectAll(".centroid").remove();
        svg.selectAll(".centroid")
            .data(centroids)
            .enter().append("circle")
            .attr("class", "centroid")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 10)
            .style("fill", (d, i) => colorScale(i))
            .style("stroke", "#fff")
            .style("stroke-width", 2);
    }

    function updateCentroids(clusters) {
        return clusters.map(cluster => {
            if (cluster.length === 0) {
                return { x: Math.random() * 100, y: Math.random() * 100 };
            }
            const sumX = cluster.reduce((sum, point) => sum + point.x, 0);
            const sumY = cluster.reduce((sum, point) => sum + point.y, 0);
            return { x: sumX / cluster.length, y: sumY / cluster.length };
        });
    }

    function drawClusterHulls(clusters) {
        svg.select(".hull-paths").selectAll(".hull").remove();

        clusters.forEach((cluster, i) => {
            if (cluster.length < 3) return;
            const points = cluster.map(p => [xScale(p.x), yScale(p.y)]);
            const hull = d3.polygonHull(points);
            if (hull) {
                svg.select(".hull-paths").insert("path", ".point")
                    .attr("class", "hull")
                    .datum(hull)
                    .attr("d", d => `M${d.join("L")}Z`)
                    .style("fill", colorScale(i))
                    .style("stroke", colorScale(i))
                    .style("stroke-width", 2)
                    .style("fill-opacity", 0.15)
                    .style("stroke-linejoin", "round");
            }
        });
    }

    async function visualizeAssignment(clusters) {
        drawClusterHulls(clusters);

        svg.selectAll(".point")
            .transition().duration(500)
            .style("fill", (d) => {
                for (let i = 0; i < clusters.length; i++) {
                    if (clusters[i].includes(d)) 
                        return colorScale(i);
                }
                return "#555";
            });
        await new Promise(r => setTimeout(r, 700));
    }

    async function visualizeCentroidUpdate(newCentroids) {
        svg.selectAll(".centroid")
            .data(newCentroids)
            .transition().duration(500)
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y));
        
        centroids = newCentroids;
        await new Promise(r => setTimeout(r, 700));
    }

    function euclideanDistance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    function manhattanDistance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    function getDistanceFunction() {
        const metric = distanceMetricSelect.value;
        if (metric === 'manhattan') {
            return manhattanDistance;
        }
        return euclideanDistance;
    }

    // Fisher-Yates (aka Knuth) Shuffle
    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        // While there remain elements to shuffle.
        while (currentIndex != 0) {
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // Centroid Initialization Methods
    function forgyInitialization(k) {
        // Shuffle the data array and pick the first k points
        const shuffledData = shuffle([...data]);
        return shuffledData.slice(0, k).map(d => ({ ...d }));
    }

    function randomPartitionInitialization(k) {
        const randomClusters = new Array(k).fill(0).map(() => []);
        data.forEach(point => {
            const randomIndex = Math.floor(Math.random() * k);
            randomClusters[randomIndex].push(point);
        });
        return updateCentroids(randomClusters);
    }

    function kmeansPlusPlusInitialization(k) {
        const distanceFunc = getDistanceFunction();
        const initialCentroids = [];

        // 1. Choose one center uniformly at random from among the data points.
        const firstCentroidIndex = Math.floor(Math.random() * data.length);
        const firstCentroid = data[firstCentroidIndex];
        initialCentroids.push({...firstCentroid});

        // 2. For each data point x, compute D(x), the distance between x and the nearest center that has already been chosen.
        let distances = new Array(data.length).fill(Infinity);

        for (let i = 1; i < k; i++) {
            // Update distances to the nearest centroid
            data.forEach((point, pointIndex) => {
                const dist = distanceFunc(point, initialCentroids[initialCentroids.length - 1]);
                distances[pointIndex] = Math.min(distances[pointIndex], dist);
            });

            // 3. Choose one new data point at random as a new center, using a weighted probability distribution where a point x is chosen with probability proportional to D(x)^2.
            const distSquaredSum = distances.reduce((sum, d) => sum + d * d, 0);
            const randomValue = Math.random() * distSquaredSum;
            
            let cumulativeSum = 0;
            let nextCentroidIndex = -1;

            for (let j = 0; j < distances.length; j++) {
                cumulativeSum += distances[j] * distances[j];
                if (cumulativeSum >= randomValue) {
                    nextCentroidIndex = j;
                    break;
                }
            }
            initialCentroids.push({...data[nextCentroidIndex]});
        }
        return initialCentroids;
    }

    function initializeCentroids(k) {
        const method = initMethodSelect.value;
        switch (method) {
            case 'random_partition':
                return randomPartitionInitialization(k);
            case 'kmeans++':
                return kmeansPlusPlusInitialization(k);
            case 'forgy':
            default:
                return forgyInitialization(k);
        }
    }

    function assignToClusters(data, centroids) {
        const distanceFunc = getDistanceFunction();
        const clusters = new Array(centroids.length).fill(0).map(() => []);
        data.forEach(point => {
            let minDistance = Infinity;
            let closestCentroidIndex = -1;
            centroids.forEach((centroid, i) => {
                const dist = distanceFunc(point, centroid);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestCentroidIndex = i;
                }
            });
            clusters[closestCentroidIndex].push(point);
        });
        return clusters;
    }

    function startVisualization() {
        if (visualizationInProgress) return;
        visualizationInProgress = true;
        iterationCount = 0;
        startBtn.disabled = true;
        nextStepBtn.disabled = false;

        const k = parseInt(kValueInput.value, 10);
        centroids = initializeCentroids(k);
        drawCentroids(centroids);
    }

    async function performNextStep() {
        if (!visualizationInProgress) return;
        iterationCount++;
        nextStepBtn.disabled = true;

        // Assignment step
        clusters = assignToClusters(data, centroids);
        await visualizeAssignment(clusters);

        // Update step
        const newCentroids = updateCentroids(clusters);
        const changed = JSON.stringify(centroids) !== JSON.stringify(newCentroids);

        if (changed) {
            await visualizeCentroidUpdate(newCentroids);
            nextStepBtn.disabled = false; // Re-enable for next step
        } else {
            visualizationInProgress = false;
            completionMessage.textContent = `Algorithm converged in ${iterationCount} steps.`;
            completionMessage.classList.remove('hidden');
        }
    }

    resetBtn.addEventListener('click', initializePlot);
    startBtn.addEventListener('click', startVisualization);
    nextStepBtn.addEventListener('click', performNextStep);

    initializePlot();
});

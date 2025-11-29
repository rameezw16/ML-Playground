document.addEventListener('DOMContentLoaded', () => {
    const kmeansLink = document.getElementById('kmeans-link');
    const dbscanLink = document.getElementById('dbscan-link');
    const mainTitle = document.getElementById('main-title');
    const kmeansControls = document.getElementById('kmeans-controls');
    const dbscanControls = document.getElementById('dbscan-controls');
    const nextStepBtn = document.getElementById('next-step-btn');
    const epsilonValue = document.getElementById('epsilon-value');
    const epsilonDisplay = document.getElementById('epsilon-display');
    const pointsControl = document.getElementById('points-control');
    const shapeType = document.getElementById('shape-type');

    let activeAlgorithm = 'kmeans'; // or 'dbscan'

    function getNumPoints() {
        if (shapeType.value === 'random') {
            return parseInt(document.getElementById('points-value').value, 10);
        }
        if (shapeType.value === 'circle') {
            return 400;
        }
        return 200;
    }

    function reinitializeCurrentAlgorithmPlot() {
        const numPoints = getNumPoints();
        if (activeAlgorithm === 'kmeans') {
            window.KMeans.initializePlot(numPoints);
        } else {
            window.DBSCAN.initializePlot(numPoints);
        }
    }


    function switchAlgorithm(algo) {
        activeAlgorithm = algo;

        // Update active link
        document.querySelectorAll('.sidebar nav ul li a').forEach(link => link.classList.remove('active'));
        document.getElementById(`${algo}-link`).classList.add('active');

        if (algo === 'kmeans') {
            mainTitle.textContent = 'K-Means Clustering Visualizer';
            kmeansControls.classList.remove('hidden');
            dbscanControls.classList.add('hidden');
            nextStepBtn.style.display = 'inline-block';
            reinitializeCurrentAlgorithmPlot();
        } else if (algo === 'dbscan') {
            mainTitle.textContent = 'DBSCAN Clustering Visualizer';
            dbscanControls.classList.remove('hidden');
            kmeansControls.classList.add('hidden');
            nextStepBtn.style.display = 'none'; // DBSCAN doesn't have steps
            reinitializeCurrentAlgorithmPlot();
        }
    }

    kmeansLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchAlgorithm('kmeans');
    });

    dbscanLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchAlgorithm('dbscan');
    });

    epsilonValue.addEventListener('input', (e) => {
        epsilonDisplay.textContent = e.target.value;
    });

    // Initialize with K-Means
    switchAlgorithm('kmeans');

    // This is a bit of a hack to make the functions from other files available.
    // A better approach would be to use modules.
    const resetBtn = document.getElementById('reset-btn');
    const startBtn = document.getElementById('start-btn');
    
    resetBtn.addEventListener('click', () => {
        reinitializeCurrentAlgorithmPlot();
    });

    startBtn.addEventListener('click', () => {
        if (activeAlgorithm === 'kmeans') {
            window.KMeans.startVisualization();
        } else {
            window.DBSCAN.startVisualization();
        }
    });

    nextStepBtn.addEventListener('click', () => {
        if (activeAlgorithm === 'kmeans') {
            window.KMeans.performNextStep();
        }
    });

    const pointsValueInput = document.getElementById('points-value');
    pointsValueInput.addEventListener('input', () => {
        reinitializeCurrentAlgorithmPlot();
    });

    shapeType.addEventListener('input', () => {
        if (shapeType.value === 'random') {
            pointsControl.classList.remove('hidden');
        } else {
            pointsControl.classList.add('hidden');
        }
        reinitializeCurrentAlgorithmPlot();
    });
});

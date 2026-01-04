# ML-Playground: Unsupervised Learning Visualizer

An interactive web-based visualization tool for understanding unsupervised machine learning algorithms. This project demonstrates how various clustering and dimensionality reduction techniques work through step-by-step visual animations.

## Features

### Algorithms Implemented

1. **K-Means Clustering**
   - Multiple initialization methods: Forgy, Random Partition, K-Means++
   - Adjustable number of clusters (K)
   - Distance metrics: Euclidean and Manhattan
   - Step-by-step visualization of centroid movement and cluster assignment

2. **Hierarchical Clustering**
   - Dendogram visualization
   - Multiple linkage methods for agglomerative clustering
   - Interactive cluster threshold adjustment

3. **DBSCAN (Density-Based Clustering)**
   - Epsilon (ε) parameter control
   - Minimum points threshold adjustment
   - Point state visualization (core, border, noise, unvisited)
   - Step-by-step cluster expansion

4. **PCA (Principal Component Analysis)**
   - Data centering and standardization
   - Eigenvalue and eigenvector computation
   - Principal component projection
   - Visualization of variance explanation

### Data Shapes

The visualizer includes various synthetic datasets to test algorithm behavior:
- Random points
- Moons pattern
- Circles pattern
- Blobs
- Elongated Gaussian clouds
- Diagonal clusters
- S-curve pattern

### Interactive Controls

- **Step-by-step execution**: Navigate through algorithm iterations
- **Autoplay mode**: Watch algorithms run automatically
- **Fast-forward**: Speed up execution
- **Customizable parameters**: Adjust algorithm-specific settings in real-time
- **Multiple dataset shapes**: Test algorithms on different data distributions

## Project Structure

```
public/
├── index.html       # Main HTML interface
├── style.css        # Styling and layout
├── script.js        # Main application controller
├── kmeans.js        # K-Means implementation
├── hierarchical.js  # Hierarchical clustering implementation
├── dbscan.js        # DBSCAN implementation
├── pca.js           # PCA implementation
├── plot.js          # D3.js visualization utilities
├── shapes.js        # Dataset generation functions
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: D3.js
- **Random Seeding**: seedrandom.js for reproducible results



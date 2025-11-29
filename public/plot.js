window.Plot = (() => {
    const margin = { top: 50, right: 20, bottom: 30, left: 40 }; // Increased top margin for status text

    function initialize(containerId) {
        const plotDiv = document.getElementById(containerId);
        d3.select(`#${containerId} > svg`).remove();

        const width = (plotDiv.clientWidth - margin.left - margin.right);
        const height = width;

        const svg = d3.select(`#${containerId}`).append("svg")
            .attr("id", "plot-svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
        const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickSizeOuter(0))
            .selectAll("text").style("fill", "#e0e0e0");
        
        svg.append("g")
            .call(d3.axisLeft(yScale).tickSizeOuter(0))
            .selectAll("text").style("fill", "#e0e0e0");

        return { svg, xScale, yScale };
    }

    return {
        initialize
    };
})();

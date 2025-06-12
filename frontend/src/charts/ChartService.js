// Chart Service for D3.js visualizations

import * as d3 from 'd3';

export class ChartService {
    constructor() {
        this.defaultColors = {
            primary: '#3b82f6',
            secondary: '#6b7280',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#06b6d4'
        };
        
        this.categoryColors = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
            '#ec4899', '#6366f1', '#14b8a6', '#eab308'
        ];
    }

    // Line Chart for trends (Income vs Expenses)
    createLineChart(containerId, data, options = {}) {
        const container = d3.select(`#${containerId}`);
        container.selectAll('*').remove();

        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('class', 'd3-chart');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Parse dates and prepare data
        const parseDate = d3.timeParse('%b %Y');
        const formatDate = d3.timeFormat('%b');
        
        data.forEach(d => {
            d.date = parseDate(d.month);
        });

        // Scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => Math.max(d.income, d.expenses))])
            .nice()
            .range([height, 0]);

        // Line generators
        const incomeLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.income))
            .curve(d3.curveMonotoneX);

        const expenseLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.expenses))
            .curve(d3.curveMonotoneX);

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(formatDate))
            .attr('class', 'axis');

        g.append('g')
            .call(d3.axisLeft(yScale).tickFormat(d => `$${d / 1000}K`))
            .attr('class', 'axis');

        // Add grid lines
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat('')
            )
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat('')
            )
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        // Add income line
        g.append('path')
            .datum(data)
            .attr('class', 'line')
            .attr('d', incomeLine)
            .style('stroke', this.defaultColors.success)
            .style('stroke-width', 3)
            .style('fill', 'none');

        // Add expense line
        g.append('path')
            .datum(data)
            .attr('class', 'line')
            .attr('d', expenseLine)
            .style('stroke', this.defaultColors.danger)
            .style('stroke-width', 3)
            .style('fill', 'none');

        // Add dots for income
        g.selectAll('.income-dot')
            .data(data)
            .enter().append('circle')
            .attr('class', 'income-dot')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.income))
            .attr('r', 4)
            .style('fill', this.defaultColors.success)
            .style('stroke', 'white')
            .style('stroke-width', 2);

        // Add dots for expenses
        g.selectAll('.expense-dot')
            .data(data)
            .enter().append('circle')
            .attr('class', 'expense-dot')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.expenses))
            .attr('r', 4)
            .style('fill', this.defaultColors.danger)
            .style('stroke', 'white')
            .style('stroke-width', 2);

        // Add legend
        const legend = g.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 120}, 20)`);

        const legendData = [
            { label: 'Income', color: this.defaultColors.success },
            { label: 'Expenses', color: this.defaultColors.danger }
        ];

        const legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`);

        legendItems.append('rect')
            .attr('width', 12)
            .attr('height', 3)
            .style('fill', d => d.color);

        legendItems.append('text')
            .attr('x', 18)
            .attr('y', 0)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('fill', '#374151')
            .text(d => d.label);

        // Add tooltip
        this.addTooltip(g, data, xScale, yScale, width, height);

        return svg.node();
    }

    // Pie Chart for category breakdown
    createPieChart(containerId, data, options = {}) {
        const container = d3.select(`#${containerId}`);
        container.selectAll('*').remove();

        const width = container.node().getBoundingClientRect().width;
        const height = 300;
        const radius = Math.min(width, height) / 2 - 40;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'd3-chart');

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Create pie layout
        const pie = d3.pie()
            .value(d => d.amount)
            .sort(null);

        // Create arc generator
        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const labelArc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius * 0.6);

        // Generate arcs
        const arcs = g.selectAll('.arc')
            .data(pie(data))
            .enter().append('g')
            .attr('class', 'arc');

        // Add pie slices
        arcs.append('path')
            .attr('d', arc)
            .style('fill', (d, i) => this.categoryColors[i % this.categoryColors.length])
            .style('stroke', 'white')
            .style('stroke-width', 2)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 0.8);
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
            });

        // Add labels
        arcs.append('text')
            .attr('transform', d => `translate(${labelArc.centroid(d)})`)
            .attr('dy', '0.35em')
            .style('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', '500')
            .style('fill', 'white')
            .text(d => d.data.percentage > 5 ? `${d.data.percentage.toFixed(1)}%` : '');

        // Add legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(20, 20)`);

        const legendItems = legend.selectAll('.legend-item')
            .data(data)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`);

        legendItems.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .style('fill', (d, i) => this.categoryColors[i % this.categoryColors.length]);

        legendItems.append('text')
            .attr('x', 18)
            .attr('y', 6)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('fill', '#374151')
            .text(d => d.category);

        return svg.node();
    }

    // Bar Chart for budget performance
    createBarChart(containerId, data, options = {}) {
        const container = d3.select(`#${containerId}`);
        container.selectAll('*').remove();

        const margin = { top: 20, right: 30, bottom: 60, left: 60 };
        const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('class', 'd3-chart');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.category))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => Math.max(d.budgeted, d.spent))])
            .nice()
            .range([height, 0]);

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .attr('class', 'axis')
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        g.append('g')
            .call(d3.axisLeft(yScale).tickFormat(d => `$${d}`))
            .attr('class', 'axis');

        // Add grid lines
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat('')
            )
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        // Add budgeted bars
        g.selectAll('.budgeted-bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'budgeted-bar')
            .attr('x', d => xScale(d.category))
            .attr('y', d => yScale(d.budgeted))
            .attr('width', xScale.bandwidth() / 2)
            .attr('height', d => height - yScale(d.budgeted))
            .style('fill', this.defaultColors.primary)
            .style('opacity', 0.7);

        // Add spent bars
        g.selectAll('.spent-bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'spent-bar')
            .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.spent))
            .attr('width', xScale.bandwidth() / 2)
            .attr('height', d => height - yScale(d.spent))
            .style('fill', d => d.spent > d.budgeted ? this.defaultColors.danger : this.defaultColors.success);

        // Add legend
        const legend = g.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 120}, 20)`);

        const legendData = [
            { label: 'Budgeted', color: this.defaultColors.primary },
            { label: 'Spent', color: this.defaultColors.success }
        ];

        const legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`);

        legendItems.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .style('fill', d => d.color);

        legendItems.append('text')
            .attr('x', 18)
            .attr('y', 6)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('fill', '#374151')
            .text(d => d.label);

        return svg.node();
    }

    // Area Chart for spending trends
    createAreaChart(containerId, data, options = {}) {
        const container = d3.select(`#${containerId}`);
        container.selectAll('*').remove();

        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('class', 'd3-chart');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Parse dates
        const parseDate = d3.timeParse('%b %Y');
        const formatDate = d3.timeFormat('%b');
        
        data.forEach(d => {
            d.date = parseDate(d.month);
        });

        // Scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.income)])
            .nice()
            .range([height, 0]);

        // Area generators
        const incomeArea = d3.area()
            .x(d => xScale(d.date))
            .y0(height)
            .y1(d => yScale(d.income))
            .curve(d3.curveMonotoneX);

        const expensesArea = d3.area()
            .x(d => xScale(d.date))
            .y0(height)
            .y1(d => yScale(d.expenses))
            .curve(d3.curveMonotoneX);

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(formatDate))
            .attr('class', 'axis');

        g.append('g')
            .call(d3.axisLeft(yScale).tickFormat(d => `$${d / 1000}K`))
            .attr('class', 'axis');

        // Add income area
        g.append('path')
            .datum(data)
            .attr('class', 'area')
            .attr('d', incomeArea)
            .style('fill', this.defaultColors.success)
            .style('fill-opacity', 0.3);

        // Add expenses area
        g.append('path')
            .datum(data)
            .attr('class', 'area')
            .attr('d', expensesArea)
            .style('fill', this.defaultColors.danger)
            .style('fill-opacity', 0.3);

        return svg.node();
    }

    // Donut Chart for goals progress
    createDonutChart(containerId, data, options = {}) {
        const container = d3.select(`#${containerId}`);
        container.selectAll('*').remove();

        const width = container.node().getBoundingClientRect().width;
        const height = 300;
        const radius = Math.min(width, height) / 2 - 40;
        const innerRadius = radius * 0.6;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'd3-chart');

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Create pie layout
        const pie = d3.pie()
            .value(d => d.current)
            .sort(null);

        // Create arc generator
        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(radius);

        // Generate arcs
        const arcs = g.selectAll('.arc')
            .data(pie(data))
            .enter().append('g')
            .attr('class', 'arc');

        // Add donut segments
        arcs.append('path')
            .attr('d', arc)
            .style('fill', (d, i) => this.categoryColors[i % this.categoryColors.length])
            .style('stroke', 'white')
            .style('stroke-width', 2);

        // Add center text
        const centerText = g.append('g')
            .attr('class', 'center-text')
            .attr('text-anchor', 'middle');

        centerText.append('text')
            .attr('y', -10)
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .style('fill', '#374151')
            .text('Goals');

        centerText.append('text')
            .attr('y', 15)
            .style('font-size', '16px')
            .style('fill', '#6b7280')
            .text(`${data.length} active`);

        return svg.node();
    }

    // Add tooltip functionality
    addTooltip(g, data, xScale, yScale, width, height) {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('font-size', '12px')
            .style('z-index', '1000');

        // Add invisible overlay for mouse tracking
        g.append('rect')
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'transparent')
            .on('mousemove', function(event) {
                const [mouseX] = d3.pointer(event);
                const x0 = xScale.invert(mouseX);
                const bisect = d3.bisector(d => d.date).left;
                const i = bisect(data, x0, 1);
                const d0 = data[i - 1];
                const d1 = data[i];
                const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);

                tooltip.html(`
                    <strong>${d.month}</strong><br/>
                    Income: $${d.income.toLocaleString()}<br/>
                    Expenses: $${d.expenses.toLocaleString()}<br/>
                    Savings: $${d.savings.toLocaleString()}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
    }

    // Utility method to resize charts
    resizeChart(containerId, chartType, data, options = {}) {
        switch (chartType) {
            case 'line':
                return this.createLineChart(containerId, data, options);
            case 'pie':
                return this.createPieChart(containerId, data, options);
            case 'bar':
                return this.createBarChart(containerId, data, options);
            case 'area':
                return this.createAreaChart(containerId, data, options);
            case 'donut':
                return this.createDonutChart(containerId, data, options);
            default:
                console.warn(`Unknown chart type: ${chartType}`);
                return null;
        }
    }

    // Clean up method
    cleanup(containerId) {
        const container = d3.select(`#${containerId}`);
        container.selectAll('*').remove();
        
        // Remove any existing tooltips
        d3.selectAll('.tooltip').remove();
    }
}
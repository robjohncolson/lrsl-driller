/**
 * Graph Engine - Data-driven visualization system
 * Renders scatterplots, residual plots, histograms, etc.
 * Topic-agnostic: cartridge provides the data and config
 */

export class GraphEngine {
  constructor(container, config = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.width = config.width || 400;
    this.height = config.height || 300;
    this.padding = config.padding || { top: 20, right: 20, bottom: 40, left: 50 };

    this.canvas = null;
    this.ctx = null;

    this.colors = {
      point: '#6366f1',       // Indigo
      pointHover: '#4f46e5',
      highlight: '#ef4444',   // Red
      line: '#10b981',        // Emerald
      grid: '#e5e7eb',
      axis: '#374151',
      text: '#6b7280',
      zeroLine: '#9ca3af',
      positive: '#22c55e',    // Green (for positive residuals)
      negative: '#ef4444'     // Red (for negative residuals)
    };

    this.init();
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    // Clear container and append
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    // Size canvas to container
    this.sizeToContainer();

    // Store for interactivity
    this.currentData = null;
    this.currentConfig = null;

    // Hover handling
    this.canvas.addEventListener('mousemove', (e) => this.handleHover(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));

    // Watch for container resize
    this.resizeObserver = new ResizeObserver(() => {
      this.sizeToContainer();
      if (this.currentConfig) {
        this.render(this.currentConfig);
      }
    });
    this.resizeObserver.observe(this.container);
  }

  sizeToContainer() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width || 400;
    this.height = rect.height || 300;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }

  /**
   * Main render method - dispatches to specific chart type
   */
  render(config) {
    this.currentConfig = config;
    this.currentData = config.data;

    this.clear();

    switch (config.type) {
      case 'scatterplot':
        this.renderScatterplot(config);
        break;
      case 'residual-plot':
        this.renderResidualPlot(config);
        break;
      case 'histogram':
        this.renderHistogram(config);
        break;
      case 'boxplot':
        this.renderBoxplot(config);
        break;
      default:
        console.warn('Unknown graph type:', config.type);
    }

    return this;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  // ============== SCATTERPLOT ==============

  renderScatterplot(config) {
    const { data, labels, features = {}, regression } = config;

    // Calculate scales
    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);

    const xMin = config.xMin ?? Math.min(...xValues) * 0.9;
    const xMax = config.xMax ?? Math.max(...xValues) * 1.1;
    const yMin = config.yMin ?? Math.min(...yValues) * 0.9;
    const yMax = config.yMax ?? Math.max(...yValues) * 1.1;

    const scales = this.calculateScales(xMin, xMax, yMin, yMax);

    // Draw grid
    this.drawGrid(scales);

    // Draw axes
    this.drawAxes(scales, labels);

    // Draw regression line if requested
    if (features.regressionLine && regression) {
      this.drawRegressionLine(scales, regression, xMin, xMax);
    }

    // Draw residual line for highlighted point
    if (features.showResidualLine && features.highlightId && regression) {
      const point = data.find(d => d.id === features.highlightId);
      if (point) {
        this.drawResidualSegment(scales, point, regression);
      }
    }

    // Draw points
    data.forEach(point => {
      const isHighlight = features.highlightId === point.id;
      this.drawPoint(scales, point, isHighlight);
    });

    // Draw equation if requested
    if (features.showEquation && regression) {
      this.drawEquation(regression);
    }
  }

  // ============== RESIDUAL PLOT ==============

  renderResidualPlot(config) {
    const { data, labels, features = {} } = config;

    // For residual plots, y-axis is residuals (centered at 0)
    const xValues = data.map(d => d.x);
    const residuals = data.map(d => d.residual ?? d.y);

    const xMin = config.xMin ?? Math.min(...xValues) * 0.9;
    const xMax = config.xMax ?? Math.max(...xValues) * 1.1;

    // Y-axis symmetric around 0
    const maxResidual = Math.max(...residuals.map(Math.abs)) * 1.2;
    const yMin = -maxResidual;
    const yMax = maxResidual;

    const scales = this.calculateScales(xMin, xMax, yMin, yMax);

    // Draw grid
    this.drawGrid(scales);

    // Draw zero line (prominent)
    if (features.zeroLine !== false) {
      this.drawZeroLine(scales);
    }

    // Draw axes
    this.drawAxes(scales, {
      x: labels?.x || 'X',
      y: labels?.y || 'Residual'
    });

    // Draw points with color based on sign
    data.forEach(point => {
      const residual = point.residual ?? point.y;
      const isHighlight = features.highlightId === point.id;
      const color = residual >= 0 ? this.colors.positive : this.colors.negative;

      this.drawPoint(scales, { x: point.x, y: residual, id: point.id }, isHighlight, color);
    });
  }

  // ============== DRAWING PRIMITIVES ==============

  calculateScales(xMin, xMax, yMin, yMax) {
    const plotWidth = this.width - this.padding.left - this.padding.right;
    const plotHeight = this.height - this.padding.top - this.padding.bottom;

    return {
      xMin, xMax, yMin, yMax,
      plotWidth, plotHeight,
      xScale: (x) => this.padding.left + ((x - xMin) / (xMax - xMin)) * plotWidth,
      yScale: (y) => this.padding.top + plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight
    };
  }

  drawGrid(scales) {
    const ctx = this.ctx;
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;

    // Vertical grid lines
    const xStep = (scales.xMax - scales.xMin) / 5;
    for (let x = scales.xMin; x <= scales.xMax; x += xStep) {
      const px = scales.xScale(x);
      ctx.beginPath();
      ctx.moveTo(px, this.padding.top);
      ctx.lineTo(px, this.height - this.padding.bottom);
      ctx.stroke();
    }

    // Horizontal grid lines
    const yStep = (scales.yMax - scales.yMin) / 5;
    for (let y = scales.yMin; y <= scales.yMax; y += yStep) {
      const py = scales.yScale(y);
      ctx.beginPath();
      ctx.moveTo(this.padding.left, py);
      ctx.lineTo(this.width - this.padding.right, py);
      ctx.stroke();
    }
  }

  drawAxes(scales, labels) {
    const ctx = this.ctx;

    // X-axis
    ctx.strokeStyle = this.colors.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.padding.left, this.height - this.padding.bottom);
    ctx.lineTo(this.width - this.padding.right, this.height - this.padding.bottom);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(this.padding.left, this.padding.top);
    ctx.lineTo(this.padding.left, this.height - this.padding.bottom);
    ctx.stroke();

    // Labels
    ctx.fillStyle = this.colors.text;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';

    if (labels?.x) {
      ctx.fillText(labels.x, this.width / 2, this.height - 5);
    }

    if (labels?.y) {
      ctx.save();
      ctx.translate(12, this.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(labels.y, 0, 0);
      ctx.restore();
    }

    // Tick labels
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = this.colors.text;

    const xStep = (scales.xMax - scales.xMin) / 5;
    for (let x = scales.xMin; x <= scales.xMax; x += xStep) {
      const px = scales.xScale(x);
      ctx.fillText(x.toFixed(1), px, this.height - this.padding.bottom + 15);
    }

    ctx.textAlign = 'right';
    const yStep = (scales.yMax - scales.yMin) / 5;
    for (let y = scales.yMin; y <= scales.yMax; y += yStep) {
      const py = scales.yScale(y);
      ctx.fillText(y.toFixed(1), this.padding.left - 5, py + 3);
    }
  }

  drawZeroLine(scales) {
    const ctx = this.ctx;
    const y0 = scales.yScale(0);

    ctx.strokeStyle = this.colors.zeroLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(this.padding.left, y0);
    ctx.lineTo(this.width - this.padding.right, y0);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawRegressionLine(scales, regression, xMin, xMax) {
    const ctx = this.ctx;
    const { slope, intercept } = regression;

    const x1 = xMin;
    const y1 = intercept + slope * x1;
    const x2 = xMax;
    const y2 = intercept + slope * x2;

    ctx.strokeStyle = this.colors.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scales.xScale(x1), scales.yScale(y1));
    ctx.lineTo(scales.xScale(x2), scales.yScale(y2));
    ctx.stroke();
  }

  drawResidualSegment(scales, point, regression) {
    const ctx = this.ctx;
    const predicted = regression.intercept + regression.slope * point.x;

    ctx.strokeStyle = point.y > predicted ? this.colors.positive : this.colors.negative;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(scales.xScale(point.x), scales.yScale(point.y));
    ctx.lineTo(scales.xScale(point.x), scales.yScale(predicted));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawPoint(scales, point, isHighlight = false, customColor = null) {
    const ctx = this.ctx;
    const px = scales.xScale(point.x);
    const py = scales.yScale(point.y);
    const radius = isHighlight ? 8 : 5;

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = isHighlight ? this.colors.highlight : (customColor || this.colors.point);
    ctx.fill();

    if (isHighlight) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Store position for hover detection
    point._px = px;
    point._py = py;
    point._radius = radius;
  }

  drawEquation(regression) {
    const ctx = this.ctx;
    const { slope, intercept } = regression;

    const sign = intercept >= 0 ? '+' : '';
    const equation = `ŷ = ${slope.toFixed(2)}x ${sign} ${intercept.toFixed(2)}`;

    ctx.fillStyle = this.colors.text;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(equation, this.padding.left + 10, this.padding.top + 15);
  }

  // ============== HISTOGRAM ==============

  renderHistogram(config) {
    // TODO: Implement histogram rendering
    console.log('Histogram rendering not yet implemented');
  }

  // ============== BOXPLOT ==============

  renderBoxplot(config) {
    // TODO: Implement boxplot rendering
    console.log('Boxplot rendering not yet implemented');
  }

  // ============== INTERACTIVITY ==============

  handleHover(e) {
    if (!this.currentData) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    // Find closest point
    let closest = null;
    let minDist = Infinity;

    for (const point of this.currentData) {
      if (point._px === undefined) continue;
      const dist = Math.sqrt((x - point._px) ** 2 + (y - point._py) ** 2);
      if (dist < minDist && dist < 20) {
        minDist = dist;
        closest = point;
      }
    }

    this.canvas.style.cursor = closest ? 'pointer' : 'default';

    // TODO: Show tooltip
  }

  handleClick(e) {
    if (!this.currentData || !this.currentConfig?.onPointClick) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    for (const point of this.currentData) {
      if (point._px === undefined) continue;
      const dist = Math.sqrt((x - point._px) ** 2 + (y - point._py) ** 2);
      if (dist < point._radius + 5) {
        this.currentConfig.onPointClick(point);
        break;
      }
    }
  }

  /**
   * Resize the graph (manual resize, or use container dimensions if no args)
   */
  resize(width, height) {
    if (width && height) {
      this.width = width;
      this.height = height;
      this.canvas.width = width;
      this.canvas.height = height;
    } else {
      this.sizeToContainer();
    }

    if (this.currentConfig) {
      this.render(this.currentConfig);
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
}

export default GraphEngine;

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
      lineAfter: '#3b82f6',   // Blue (for "after removal" regression)
      lineBefore: '#9ca3af',  // Gray (for "before" regression, dashed)
      grid: '#e5e7eb',
      axis: '#374151',
      text: '#6b7280',
      zeroLine: '#9ca3af',
      positive: '#22c55e',    // Green (for positive residuals)
      negative: '#ef4444',    // Red (for negative residuals)
      removedPoint: '#fca5a5' // Light red (faded removed point)
    };

    // Animation state
    this.animationState = null;

    this.init();
  }

  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    // Clear container and append
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.appendChild(this.canvas);

    // Create tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'graph-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-family: ui-monospace, monospace;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 10;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    this.container.appendChild(this.tooltip);

    // Size canvas to container
    this.sizeToContainer();

    // Store for interactivity
    this.currentData = null;
    this.currentConfig = null;
    this.selectedPoint = null;

    // Hover handling
    this.canvas.addEventListener('mousemove', (e) => this.handleHover(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mouseleave', () => this.hideTooltip());

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
      case 'normal-curve':
        this.renderNormalCurve(config);
        break;
      case 'dual-normal-curve':
        this.renderDualNormalCurve(config);
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
    const { data, points, labels, features = {}, regression, centroid, xLabel, yLabel } = config;

    // Support both 'data' and 'points' for flexibility
    const plotData = data || points || [];

    // Calculate scales
    const xValues = plotData.map(d => d.x);
    const yValues = plotData.map(d => d.y);

    // Include regression line endpoints in scale calculation
    let allYValues = [...yValues];
    if (regression && regression.show) {
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      allYValues.push(regression.a + regression.b * minX);
      allYValues.push(regression.a + regression.b * maxX);
    }

    const xMin = config.xMin ?? Math.min(...xValues) * 0.9;
    const xMax = config.xMax ?? Math.max(...xValues) * 1.1;
    const yMin = config.yMin ?? Math.min(...allYValues) * 0.9;
    const yMax = config.yMax ?? Math.max(...allYValues) * 1.1;

    const scales = this.calculateScales(xMin, xMax, yMin, yMax);

    // Draw grid
    this.drawGrid(scales);

    // Draw axes with flexible label support
    this.drawAxes(scales, labels || { x: xLabel || 'X', y: yLabel || 'Y' });

    // Draw regression line if requested (support both formats)
    const showRegression = (features.regressionLine && regression) || (regression && regression.show);
    if (showRegression && regression) {
      this.drawRegressionLine(scales, regression, xMin, xMax);
    }

    // Draw residual line for highlighted point
    if (features.showResidualLine && features.highlightId && regression) {
      const point = plotData.find(d => d.id === features.highlightId);
      if (point) {
        this.drawResidualSegment(scales, point, regression);
      }
    }

    // Draw points
    plotData.forEach(point => {
      const isHighlight = features.highlightId === point.id;
      this.drawPoint(scales, point, isHighlight);
    });

    // Draw centroid marker if provided (useful for find-a mode)
    if (centroid && centroid.show) {
      this.drawCentroid(scales, centroid);
    }

    // Draw equation if requested
    if (features.showEquation && regression) {
      this.drawEquation(regression);
    }
  }

  /**
   * Draw centroid marker (x̄, ȳ) with label
   */
  drawCentroid(scales, centroid) {
    const { ctx } = this;
    const px = scales.xScale(centroid.x);
    const py = scales.yScale(centroid.y);

    // Draw crosshair
    ctx.strokeStyle = '#059669'; // emerald-600
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);

    // Horizontal line through centroid
    ctx.beginPath();
    ctx.moveTo(this.padding.left, py);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Vertical line through centroid
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, this.height - this.padding.bottom);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw point
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();

    // Draw white inner circle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label
    if (centroid.label) {
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(centroid.label, px + 10, py - 8);
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
    // Support both naming conventions: {slope, intercept} or {b, a}
    const slope = regression.slope ?? regression.b;
    const intercept = regression.intercept ?? regression.a;

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
    const slope = regression.slope ?? regression.b;
    const intercept = regression.intercept ?? regression.a;
    const predicted = intercept + slope * point.x;

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

  // ============== NORMAL CURVE ==============

  renderNormalCurve(config) {
    const { mean, sd, markedValue, labels = {}, showZLabels = false, showXUnknown = false } = config;
    const ctx = this.ctx;

    // Calculate display range: mean ± 4 standard deviations
    const xMin = mean - 4 * sd;
    const xMax = mean + 4 * sd;

    // Y range for normal PDF (max height at mean)
    const yMax = this.normalPDF(mean, mean, sd) * 1.15;
    const yMin = 0;

    const scales = this.calculateScales(xMin, xMax, yMin, yMax);

    // Draw light grid
    this.drawNormalGrid(scales, mean, sd);

    // Draw the normal curve
    this.drawNormalCurvePath(scales, mean, sd);

    // Draw x-axis
    this.drawNormalAxis(scales, mean, sd, labels, showZLabels);

    // Mark the mean
    this.drawMeanLine(scales, mean, sd);

    // Mark standard deviation lines at ±1, ±2, ±3
    this.drawSDLines(scales, mean, sd);

    // If there's a marked value, highlight it
    if (markedValue !== undefined) {
      this.drawMarkedValue(scales, mean, sd, markedValue);
    }

    // Draw legend/info
    this.drawNormalInfo(mean, sd, markedValue, showXUnknown);
  }

  // ============== DUAL NORMAL CURVE (for comparing distributions) ==============

  renderDualNormalCurve(config) {
    const { distributions } = config;
    const ctx = this.ctx;

    // We'll draw two curves side by side
    const dist1 = distributions[0]; // { mean, sd, markedValue, label }
    const dist2 = distributions[1];

    // Calculate the plotting area - split into two halves
    const halfWidth = (this.width - this.padding.left - this.padding.right) / 2;
    const gapBetween = 20;

    // Draw distribution A (left side)
    this.renderSingleNormalInRegion(
      dist1,
      this.padding.left,
      halfWidth - gapBetween / 2,
      'A',
      '#6366f1' // Indigo
    );

    // Draw distribution B (right side)
    this.renderSingleNormalInRegion(
      dist2,
      this.padding.left + halfWidth + gapBetween / 2,
      halfWidth - gapBetween / 2,
      'B',
      '#8b5cf6' // Purple
    );
  }

  renderSingleNormalInRegion(dist, startX, width, label, color) {
    const ctx = this.ctx;
    const { mean, sd, markedValue } = dist;

    // Calculate display range for this distribution
    const xMin = mean - 3.5 * sd;
    const xMax = mean + 3.5 * sd;
    const yMax = this.normalPDF(mean, mean, sd) * 1.15;

    // Create local scales for this region
    const plotHeight = this.height - this.padding.top - this.padding.bottom - 40; // Extra space for labels
    const scales = {
      xMin, xMax,
      yMin: 0, yMax,
      xScale: (x) => startX + ((x - xMin) / (xMax - xMin)) * width,
      yScale: (y) => this.padding.top + 20 + plotHeight - (y / yMax) * plotHeight
    };

    // Draw label at top
    ctx.fillStyle = color;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Distribution ${label}`, startX + width / 2, this.padding.top + 12);

    // Draw the curve fill
    ctx.beginPath();
    ctx.moveTo(scales.xScale(xMin), scales.yScale(0));
    const step = (xMax - xMin) / 100;
    for (let x = xMin; x <= xMax; x += step) {
      const y = this.normalPDF(x, mean, sd);
      ctx.lineTo(scales.xScale(x), scales.yScale(y));
    }
    ctx.lineTo(scales.xScale(xMax), scales.yScale(0));
    ctx.closePath();
    ctx.fillStyle = color.replace(')', ', 0.15)').replace('rgb', 'rgba').replace('#', '');
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
    ctx.fill();

    // Draw the curve outline
    ctx.beginPath();
    for (let x = xMin; x <= xMax; x += step) {
      const y = this.normalPDF(x, mean, sd);
      if (x === xMin) {
        ctx.moveTo(scales.xScale(x), scales.yScale(y));
      } else {
        ctx.lineTo(scales.xScale(x), scales.yScale(y));
      }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw x-axis
    ctx.strokeStyle = this.colors.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, scales.yScale(0));
    ctx.lineTo(startX + width, scales.yScale(0));
    ctx.stroke();

    // Draw mean line
    const meanPx = scales.xScale(mean);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(meanPx, scales.yScale(0));
    ctx.lineTo(meanPx, scales.yScale(this.normalPDF(mean, mean, sd)));
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw marked value if present
    if (markedValue !== undefined && markedValue !== null) {
      const px = scales.xScale(markedValue);
      const y = this.normalPDF(markedValue, mean, sd);
      const py = scales.yScale(y);

      // Vertical line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, scales.yScale(0));
      ctx.lineTo(px, py);
      ctx.stroke();

      // Point on curve
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw info box
    const boxX = startX + 5;
    const boxY = scales.yScale(0) + 8;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, width - 10, 52, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#374151';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`μ = ${mean}`, boxX + 8, boxY + 15);
    ctx.fillText(`σ = ${sd}`, boxX + 8, boxY + 30);

    if (markedValue !== undefined && markedValue !== null) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(`x = ${markedValue}`, boxX + 8, boxY + 45);
    }
  }

  normalPDF(x, mean, sd) {
    const coefficient = 1 / (sd * Math.sqrt(2 * Math.PI));
    const exponent = -0.5 * Math.pow((x - mean) / sd, 2);
    return coefficient * Math.exp(exponent);
  }

  drawNormalGrid(scales, mean, sd) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;

    // Vertical lines at each standard deviation
    for (let z = -3; z <= 3; z++) {
      const x = mean + z * sd;
      const px = scales.xScale(x);
      ctx.beginPath();
      ctx.moveTo(px, this.padding.top);
      ctx.lineTo(px, this.height - this.padding.bottom);
      ctx.stroke();
    }
  }

  drawNormalCurvePath(scales, mean, sd) {
    const ctx = this.ctx;
    const xMin = mean - 4 * sd;
    const xMax = mean + 4 * sd;
    const step = (xMax - xMin) / 200;

    // Fill under the curve
    ctx.beginPath();
    ctx.moveTo(scales.xScale(xMin), scales.yScale(0));

    for (let x = xMin; x <= xMax; x += step) {
      const y = this.normalPDF(x, mean, sd);
      ctx.lineTo(scales.xScale(x), scales.yScale(y));
    }

    ctx.lineTo(scales.xScale(xMax), scales.yScale(0));
    ctx.closePath();

    // Light fill
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fill();

    // Draw the curve outline
    ctx.beginPath();
    for (let x = xMin; x <= xMax; x += step) {
      const y = this.normalPDF(x, mean, sd);
      if (x === xMin) {
        ctx.moveTo(scales.xScale(x), scales.yScale(y));
      } else {
        ctx.lineTo(scales.xScale(x), scales.yScale(y));
      }
    }
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  drawNormalAxis(scales, mean, sd, labels, showZLabels = false) {
    const ctx = this.ctx;

    // X-axis line
    ctx.strokeStyle = this.colors.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.padding.left, this.height - this.padding.bottom);
    ctx.lineTo(this.width - this.padding.right, this.height - this.padding.bottom);
    ctx.stroke();

    // Tick marks and labels at each standard deviation
    ctx.fillStyle = this.colors.text;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';

    for (let z = -3; z <= 3; z++) {
      const x = mean + z * sd;
      const px = scales.xScale(x);

      // Tick mark
      ctx.beginPath();
      ctx.moveTo(px, this.height - this.padding.bottom);
      ctx.lineTo(px, this.height - this.padding.bottom + 6);
      ctx.stroke();

      // Value label
      const displayVal = Number.isInteger(x) ? x : x.toFixed(1);
      ctx.fillText(displayVal, px, this.height - this.padding.bottom + 18);

      // Z-score label (smaller, below) - only if showZLabels is true
      if (showZLabels && z !== 0) {
        ctx.font = '9px system-ui, sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(`z=${z}`, px, this.height - this.padding.bottom + 30);
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = this.colors.text;
      }
    }

    // X-axis label
    if (labels.x) {
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(labels.x, this.width / 2, this.height - 3);
    }
  }

  drawMeanLine(scales, mean, sd) {
    const ctx = this.ctx;
    const px = scales.xScale(mean);
    const yTop = scales.yScale(this.normalPDF(mean, mean, sd));

    // Dashed line from axis to peak
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, this.height - this.padding.bottom);
    ctx.lineTo(px, yTop);
    ctx.stroke();
    ctx.setLineDash([]);

    // Mean label
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('μ', px, yTop - 8);
  }

  drawSDLines(scales, mean, sd) {
    const ctx = this.ctx;

    // Draw lighter lines at ±1σ, ±2σ
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    [-2, -1, 1, 2].forEach(z => {
      const x = mean + z * sd;
      const px = scales.xScale(x);
      const yTop = scales.yScale(this.normalPDF(x, mean, sd));

      ctx.beginPath();
      ctx.moveTo(px, this.height - this.padding.bottom);
      ctx.lineTo(px, yTop);
      ctx.stroke();
    });

    ctx.setLineDash([]);
  }

  drawMarkedValue(scales, mean, sd, value) {
    const ctx = this.ctx;
    const px = scales.xScale(value);
    const y = this.normalPDF(value, mean, sd);
    const py = scales.yScale(y);
    const z = (value - mean) / sd;

    // Vertical line from axis to curve
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px, this.height - this.padding.bottom);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Point on curve
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label showing x value
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';

    // Position label to avoid overlap with mean
    const labelY = py - 15;
    ctx.fillText(`x = ${value}`, px, labelY);

    // Arrow pointing to the point on x-axis
    ctx.beginPath();
    ctx.moveTo(px, this.height - this.padding.bottom + 2);
    ctx.lineTo(px - 5, this.height - this.padding.bottom + 8);
    ctx.lineTo(px + 5, this.height - this.padding.bottom + 8);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  }

  drawNormalInfo(mean, sd, markedValue, showXUnknown = false) {
    const ctx = this.ctx;

    // Info box in top-right
    const boxX = this.width - this.padding.right - 130;
    const boxY = this.padding.top + 5;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    const showXLine = markedValue !== undefined && markedValue !== null || showXUnknown;
    const boxHeight = showXLine ? 70 : 50;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, 125, boxHeight, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#374151';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'left';

    ctx.fillText(`μ = ${mean}`, boxX + 10, boxY + 18);
    ctx.fillText(`σ = ${sd}`, boxX + 10, boxY + 36);

    if (markedValue !== undefined && markedValue !== null) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(`x = ${markedValue}`, boxX + 10, boxY + 54);
    } else if (showXUnknown) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText(`x = ?`, boxX + 10, boxY + 54);
    }
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

    // Show tooltip on hover
    if (closest) {
      this.showTooltip(closest, e.clientX - rect.left, e.clientY - rect.top);
    } else {
      this.hideTooltip();
    }
  }

  handleClick(e) {
    if (!this.currentData) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    for (const point of this.currentData) {
      if (point._px === undefined) continue;
      const dist = Math.sqrt((x - point._px) ** 2 + (y - point._py) ** 2);
      if (dist < point._radius + 5) {
        // Toggle selection
        if (this.selectedPoint === point) {
          this.selectedPoint = null;
          this.hideTooltip();
        } else {
          this.selectedPoint = point;
          this.showTooltip(point, e.clientX - rect.left, e.clientY - rect.top, true);
        }

        // Call external handler if provided
        if (this.currentConfig?.onPointClick) {
          this.currentConfig.onPointClick(point);
        }
        return;
      }
    }

    // Clicked empty space - deselect
    this.selectedPoint = null;
    this.hideTooltip();
  }

  showTooltip(point, mouseX, mouseY, pinned = false) {
    const xVal = typeof point.x === 'number' ? point.x.toFixed(2) : point.x;
    const yVal = typeof point.y === 'number' ? point.y.toFixed(2) : point.y;

    // For residual plots, show residual value
    const residualInfo = point.residual !== undefined
      ? `<br>Residual: ${point.residual.toFixed(2)}`
      : '';

    this.tooltip.innerHTML = `(${xVal}, ${yVal})${residualInfo}`;

    // Position tooltip above the point
    const tooltipRect = this.tooltip.getBoundingClientRect();
    let left = mouseX - tooltipRect.width / 2;
    let top = mouseY - tooltipRect.height - 10;

    // Keep within bounds
    left = Math.max(5, Math.min(left, this.width - tooltipRect.width - 5));
    top = Math.max(5, top);

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.opacity = '1';

    if (pinned) {
      this.tooltip.style.background = 'rgba(99, 102, 241, 0.95)'; // Indigo when pinned
    } else {
      this.tooltip.style.background = 'rgba(0, 0, 0, 0.85)';
    }
  }

  hideTooltip() {
    if (!this.selectedPoint) {
      this.tooltip.style.opacity = '0';
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

  // ============== POINT REMOVAL ANIMATION ==============

  /**
   * Animate the effect of removing a point from the dataset
   * Shows: point fading out, regression line changing
   *
   * @param {Object} options
   * @param {number} options.removeIndex - Index of the point to remove
   * @param {Object} options.newRegression - New regression { a, b } after removal
   * @param {number} options.duration - Animation duration in ms (default 1500)
   * @param {Function} options.onComplete - Callback when animation finishes
   */
  animatePointRemoval(options = {}) {
    const {
      removeIndex,
      newRegression,
      duration = 1500,
      onComplete
    } = options;

    if (!this.currentConfig || removeIndex === undefined) {
      console.warn('Cannot animate: missing config or removeIndex');
      return;
    }

    const config = this.currentConfig;
    const points = config.points || config.data || [];
    const oldRegression = config.regression;

    if (!oldRegression || !newRegression) {
      console.warn('Cannot animate: missing regression data');
      return;
    }

    // Animation phases:
    // 1. (0-500ms) Point fades and shrinks
    // 2. (500-1500ms) Regression line morphs to new position

    const startTime = performance.now();
    const pointFadeDuration = 500;
    const lineMorphDuration = 1000;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Clear and redraw base elements
      this.clear();

      // Recalculate scales
      const xValues = points.map(d => d.x);
      const yValues = points.map(d => d.y);
      const xMin = config.xMin ?? Math.min(...xValues) * 0.9;
      const xMax = config.xMax ?? Math.max(...xValues) * 1.1;
      const yMin = config.yMin ?? Math.min(...yValues) * 0.9;
      const yMax = config.yMax ?? Math.max(...yValues) * 1.1;
      const scales = this.calculateScales(xMin, xMax, yMin, yMax);

      // Draw grid
      this.drawGrid(scales);

      // Draw axes
      this.drawAxes(scales, { x: config.xLabel || 'X', y: config.yLabel || 'Y' });

      // Phase 1: Calculate point opacity (fades out in first 500ms)
      const pointProgress = Math.min(elapsed / pointFadeDuration, 1);
      const pointOpacity = 1 - this.easeOutCubic(pointProgress);
      const pointScale = 1 - this.easeOutCubic(pointProgress) * 0.5;

      // Phase 2: Calculate line morph (starts at 400ms, ends at duration)
      const lineMorphStart = 400;
      const lineProgress = Math.max(0, Math.min((elapsed - lineMorphStart) / lineMorphDuration, 1));
      const lineEased = this.easeInOutCubic(lineProgress);

      // Interpolate between old and new regression
      const currentSlope = oldRegression.b + (newRegression.b - oldRegression.b) * lineEased;
      const currentIntercept = oldRegression.a + (newRegression.a - oldRegression.a) * lineEased;

      // Draw the "before" regression line (faded, dashed) if animation started
      if (lineProgress > 0 && lineProgress < 1) {
        this.ctx.strokeStyle = this.colors.lineBefore;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.globalAlpha = 0.5;

        const x1 = xMin;
        const y1 = oldRegression.a + oldRegression.b * x1;
        const x2 = xMax;
        const y2 = oldRegression.a + oldRegression.b * x2;

        this.ctx.beginPath();
        this.ctx.moveTo(scales.xScale(x1), scales.yScale(y1));
        this.ctx.lineTo(scales.xScale(x2), scales.yScale(y2));
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
      }

      // Draw the current/morphing regression line
      const lineColor = lineProgress >= 1 ? this.colors.lineAfter : this.colors.line;
      this.ctx.strokeStyle = lineColor;
      this.ctx.lineWidth = 2.5;

      const lx1 = xMin;
      const ly1 = currentIntercept + currentSlope * lx1;
      const lx2 = xMax;
      const ly2 = currentIntercept + currentSlope * lx2;

      this.ctx.beginPath();
      this.ctx.moveTo(scales.xScale(lx1), scales.yScale(ly1));
      this.ctx.lineTo(scales.xScale(lx2), scales.yScale(ly2));
      this.ctx.stroke();

      // Draw mean lines if configured
      if (config.showMeanLines && config.xMean !== undefined) {
        this.ctx.strokeStyle = '#9ca3af';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);

        const meanPx = scales.xScale(config.xMean);
        this.ctx.beginPath();
        this.ctx.moveTo(meanPx, this.padding.top);
        this.ctx.lineTo(meanPx, this.height - this.padding.bottom);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }

      // Draw all points
      points.forEach((point, index) => {
        const isRemoved = index === removeIndex;
        const isHighlight = config.highlight?.index === index;

        if (isRemoved) {
          // Animate the removed point
          if (pointOpacity > 0.01) {
            const radius = (isHighlight ? 8 : 5) * pointScale;
            const px = scales.xScale(point.x);
            const py = scales.yScale(point.y);

            this.ctx.globalAlpha = pointOpacity;
            this.ctx.beginPath();
            this.ctx.arc(px, py, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colors.highlight;
            this.ctx.fill();

            if (isHighlight) {
              this.ctx.strokeStyle = '#fff';
              this.ctx.lineWidth = 2;
              this.ctx.stroke();
            }
            this.ctx.globalAlpha = 1;
          }

          // Show "X" mark where point was removed (after fade)
          if (pointProgress >= 1) {
            const px = scales.xScale(point.x);
            const py = scales.yScale(point.y);

            this.ctx.strokeStyle = this.colors.removedPoint;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(px - 6, py - 6);
            this.ctx.lineTo(px + 6, py + 6);
            this.ctx.moveTo(px + 6, py - 6);
            this.ctx.lineTo(px - 6, py + 6);
            this.ctx.stroke();
          }
        } else {
          // Draw normal point
          this.drawPoint(scales, point, false);
        }
      });

      // Draw info box showing slope/r changes
      if (lineProgress > 0) {
        this.drawAnimationInfo(oldRegression, newRegression, lineEased);
      }

      // Continue animation or finish
      if (progress < 1) {
        this.animationState = requestAnimationFrame(animate);
      } else {
        this.animationState = null;
        if (onComplete) onComplete();
      }
    };

    // Start animation
    this.animationState = requestAnimationFrame(animate);
  }

  /**
   * Draw info box showing before/after values during animation
   */
  drawAnimationInfo(oldReg, newReg, progress) {
    const ctx = this.ctx;
    const boxX = this.width - this.padding.right - 160;
    const boxY = this.padding.top + 10;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, 150, 70, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';

    // "Before" values (fading out)
    ctx.fillStyle = `rgba(156, 163, 175, ${1 - progress * 0.7})`;
    ctx.fillText(`Before:`, boxX + 10, boxY + 16);
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(`slope = ${oldReg.b.toFixed(3)}`, boxX + 15, boxY + 30);

    // "After" values (fading in)
    ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + progress * 0.7})`;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(`After removal:`, boxX + 10, boxY + 48);
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(`slope = ${newReg.b.toFixed(3)}`, boxX + 15, boxY + 62);
  }

  /**
   * Stop any running animation
   */
  stopAnimation() {
    if (this.animationState) {
      cancelAnimationFrame(this.animationState);
      this.animationState = null;
    }
  }

  /**
   * Easing functions for smooth animations
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopAnimation();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
}

export default GraphEngine;

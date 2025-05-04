import { Component, OnInit, ElementRef, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import * as d3 from 'd3';
import { MetricsService } from '../../../../services/metrics.service';
import { Tile } from '../shared/tile.interface';

@Component({
  selector: 'app-cpu-history',
  templateUrl: './cpu-history.component.html',
  styleUrls: ['./cpu-history.component.scss'],
  standalone: false
})
export class CpuHistoryComponent implements OnInit, OnDestroy, AfterViewInit, Tile {
  @ViewChild('chart') private chartContainer!: ElementRef;

  title = 'CPU History';
  subtitle = 'Core utilization';
  icon = 'memory';
  loading = true;
  
  // Add the missing properties referenced in the template
  cpuAverage = 0;
  cpuMaximum = 0;
  cpuTrend = 0; // Positive means increasing, negative means decreasing
  
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xAxis!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private yAxis!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private line!: d3.Line<number>;
  
  private margin = { top: 20, right: 20, bottom: 30, left: 40 };
  private width = 0;
  private height = 0;
  private subscription = new Subscription();
  
  private data: number[] = []; // CPU utilization data points
  private maxDataPoints = 30;
  
  // Current CPU value
  cpuUtilization = 0;
  cpuCount = 4; // Default number of CPU cores
  cpuModel = 'Unknown CPU';
  
  constructor(private metricsService: MetricsService) {}
  
  ngOnInit(): void {
    this.subscription.add(
      this.metricsService.getMetricsStream().subscribe(metrics => {
        this.loading = false;
        
        // Store current CPU utilization
        this.cpuUtilization = metrics.cpu || 0;
        
        // Add new data point
        this.data.push(this.cpuUtilization);
        
        // Keep only last N data points
        if (this.data.length > this.maxDataPoints) {
          this.data.shift();
        }
        
        // Update statistics
        this.updateCpuStatistics();
        
        this.updateChart();
      })
    );
  }
  
  ngAfterViewInit(): void {
    this.initializeChart();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  refresh(): void {
    this.loading = true;
    setTimeout(() => this.loading = false, 500);
  }
  
  // Calculate CPU statistics from collected data
  private updateCpuStatistics(): void {
    if (this.data.length === 0) return;
    
    // Calculate average
    this.cpuAverage = Math.round(this.data.reduce((sum, val) => sum + val, 0) / this.data.length);
    
    // Calculate maximum
    this.cpuMaximum = Math.max(...this.data);
    
    // Calculate trend (compare average of recent values to average of older values)
    const halfLength = Math.floor(this.data.length / 2);
    if (this.data.length >= 6) {
      const recentValues = this.data.slice(-halfLength);
      const olderValues = this.data.slice(0, this.data.length - halfLength);
      
      const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      const olderAvg = olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length;
      
      this.cpuTrend = recentAvg - olderAvg;
    }
  }
  
  private initializeChart(): void {
    if (!this.chartContainer) return;
    
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
    
    // Create SVG
    this.svg = d3.select(element)
      .append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);
      
    // Create a group element for the chart components
    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
      
    // Add X axis
    const x = d3.scaleLinear()
      .domain([0, this.maxDataPoints - 1])
      .range([0, this.width]);
      
    this.xAxis = this.g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(() => '') as unknown as (selection: d3.Selection<SVGGElement, unknown, null, undefined>) => void);
      
    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, 100]) // CPU utilization is 0-100%
      .range([this.height, 0]);
      
    this.yAxis = this.g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(y).ticks(5) as unknown as (selection: d3.Selection<SVGGElement, unknown, null, undefined>) => void);
      
    // Define the line
    this.line = d3.line<number>()
      .x((d, i) => x(i))
      .y(d => y(d) as number) // Fix: Cast to number to match expected type
      .curve(d3.curveMonotoneX);
      
    // Add the path for the line chart
    this.g.append('path')
      .attr('class', 'line')
      .style('fill', 'none')
      .style('stroke', '#4eff91')
      .style('stroke-width', 2);
      
    // Initial update
    this.updateChart();
  }
  
  private updateChart(): void {
    if (!this.svg || this.data.length < 2) return;
    
    // Update scales
    const x = d3.scaleLinear()
      .domain([0, this.data.length - 1])
      .range([0, this.width]);
      
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([this.height, 0]);
    
    // Fix: Update line generator with explicit return type for y accessor
    const lineGenerator = d3.line<number>()
      .x((d, i) => x(i))
      .y(d => y(d) as number); // Cast to number to resolve TypeScript error
    
    // Create path data
    const pathData = lineGenerator(this.data);
    
    // Update line
    this.svg.select('.line')
      .attr('d', pathData || '');
  }
}

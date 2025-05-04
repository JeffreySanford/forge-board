import { Component, OnInit, ElementRef, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import * as d3 from 'd3';
import { MetricsService } from '../../../../services/metrics.service';
import { Tile } from '../shared/tile.interface';

// Import NumberValue from d3-scale for explicit typing
import { NumberValue } from 'd3-scale';

interface NetworkData {
  time: Date;
  inbound: number;
  outbound: number;
}

@Component({
  selector: 'app-network-traffic',
  templateUrl: './network-traffic.component.html',
  styleUrls: ['../shared/tile.component.scss'],
  standalone: false
})
export class NetworkTrafficComponent implements OnInit, OnDestroy, Tile, AfterViewInit {
  @ViewChild('chart') private chartContainer!: ElementRef;

  title = 'Network Traffic';
  subtitle = 'Inbound & outbound';
  icon = 'swap_horiz';
  loading = true;
  
  private data: NetworkData[] = [];
  // Initialize properties with proper typing to fix "no initializer" errors
  private svg!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private margin = { top: 20, right: 20, bottom: 30, left: 40 };
  private width = 0;
  private height = 0;
  private x!: d3.ScaleTime<number, number>;
  private y!: d3.ScaleLinear<number, number>;
  private inboundLine!: d3.Line<NetworkData>;
  private outboundLine!: d3.Line<NetworkData>;
  private maxDataPoints = 20;
  private subscription = new Subscription();

  inboundTotal = 0;
  outboundTotal = 0;
  packetLoss = 0;

  constructor(private metricsService: MetricsService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.metricsService.getMetricsStream().subscribe(metrics => {
        this.loading = false;
        
        // For demonstration, use the network value and derive inbound/outbound
        // In a real scenario, you'd get actual inbound/outbound values
        const baseValue = metrics.network || 0;
        
        // Add new data point - generating simulated inbound/outbound values
        this.data.push({
          time: new Date(metrics.time),
          inbound: baseValue * 0.6 + Math.random() * 5,
          outbound: baseValue * 0.4 + Math.random() * 3
        });
        
        // Keep only last N data points
        if (this.data.length > this.maxDataPoints) {
          this.data.shift();
        }
        
        // Calculate statistics
        this.inboundTotal = Math.round(this.data.reduce((sum, point) => sum + point.inbound, 0) / this.data.length);
        this.outboundTotal = Math.round(this.data.reduce((sum, point) => sum + point.outbound, 0) / this.data.length);
        this.packetLoss = Math.min(5, Math.random() * 2); // Random packet loss between 0-2%
        
        this.updateChart();
      })
    );
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  refresh(): void {
    this.loading = true;
    setTimeout(() => this.loading = false, 500);
  }

  private createChart(): void {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;

    // Fixed type definition to use a more generic type for svg
    this.svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Define x and y scales
    this.x = d3.scaleTime().range([0, this.width]);
    this.y = d3.scaleLinear().range([this.height, 0]);

    // Define the line generators
    this.inboundLine = d3.line<NetworkData>()
      .x(d => this.x(d.time))
      .y(d => this.y(d.inbound))
      .curve(d3.curveMonotoneX);

    this.outboundLine = d3.line<NetworkData>()
      .x(d => this.x(d.time))
      .y(d => this.y(d.outbound))
      .curve(d3.curveMonotoneX);

    // Create properly typed format function
    const timeFormatFunction = (domainValue: Date | NumberValue) => {
      // Convert NumberValue to Date if needed, or cast to Date if it's already a Date
      const date = domainValue instanceof Date ? domainValue : new Date(+domainValue);
      return d3.timeFormat('%H:%M:%S')(date);
    };

    // Add the axes with proper typing
    this.svg.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(this.x).ticks(5).tickFormat(timeFormatFunction));

    this.svg.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(this.y).ticks(5));

    // Add inbound line path
    this.svg.append('path')
      .attr('class', 'line inbound-line')
      .style('fill', 'none')
      .style('stroke', '#60a5fa')
      .style('stroke-width', 2);

    // Add outbound line path
    this.svg.append('path')
      .attr('class', 'line outbound-line')
      .style('fill', 'none')
      .style('stroke', '#f59e0b')
      .style('stroke-width', 2);

    // Add legend
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.width - 100}, 0)`);

    // Inbound legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 5)
      .attr('y2', 5)
      .style('stroke', '#60a5fa')
      .style('stroke-width', 2);
      
    legend.append('text')
      .attr('x', 25)
      .attr('y', 9)
      .text('Inbound')
      .style('font-size', '10px')
      .style('fill', '#94a3b8');

    // Outbound legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 25)
      .attr('y2', 25)
      .style('stroke', '#f59e0b')
      .style('stroke-width', 2);
      
    legend.append('text')
      .attr('x', 25)
      .attr('y', 29)
      .text('Outbound')
      .style('font-size', '10px')
      .style('fill', '#94a3b8');

    this.updateChart();
  }

  private updateChart(): void {
    if (!this.svg || this.data.length === 0) return;

    // Update domains
    this.x.domain(d3.extent(this.data, d => d.time) as [Date, Date]);
    
    const maxValue = d3.max(this.data, d => Math.max(d.inbound, d.outbound)) as number;
    this.y.domain([0, maxValue * 1.2]); // Add 20% padding at the top

    // Update lines
    this.svg.select('.inbound-line')
      .datum(this.data)
      .attr('d', this.inboundLine);

    this.svg.select('.outbound-line')
      .datum(this.data)
      .attr('d', this.outboundLine);

    // Create properly typed format function (same as in createChart)
    const timeFormatFunction = (domainValue: Date | NumberValue) => {
      const date = domainValue instanceof Date ? domainValue : new Date(+domainValue);
      return d3.timeFormat('%H:%M:%S')(date);
    };

    // Update axes with proper typing using type assertions
    this.svg.select('.axis--x')
      .call(d3.axisBottom(this.x).ticks(5).tickFormat(timeFormatFunction) as unknown as (selection: d3.Selection<d3.BaseType, unknown, null, undefined>) => void);

    this.svg.select('.axis--y')
      .call(d3.axisLeft(this.y).ticks(5) as unknown as (selection: d3.Selection<d3.BaseType, unknown, null, undefined>) => void);
  }
}

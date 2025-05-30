import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import * as d3 from 'd3';
import { MetricsService } from '../../../../services/metrics.service';
import { Tile } from '../shared/tile.interface';

@Component({
  selector: 'app-disk-usage',
  templateUrl: './disk-usage.component.html',
  styleUrls: ['./disk-usage.component.scss'],
  standalone: false,
})
export class DiskUsageComponent
  implements OnInit, OnDestroy, AfterViewInit, Tile
{
  @ViewChild('chart') private chartContainer!: ElementRef;

  title = 'Disk Usage';
  subtitle = 'Storage allocation';
  icon = 'storage';
  loading = true;

  diskUsage = 0;
  freeSpace = 0;
  totalSpace = 0;

  // Add missing properties referenced in the template
  diskUsedGB = 0;
  readSpeed = 0; // MB/s
  writeSpeed = 0; // MB/s

  // Add row and col for Tile interface
  row = 0;
  col = 0;

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private pieGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  private subscription = new Subscription();

  constructor(private metricsService: MetricsService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.metricsService.getMetricsStream().subscribe((metrics) => {
        this.loading = false;

        // Update disk usage percentage
        this.diskUsage = metrics.disk || 0;

        // Calculate values in GB (mock values)
        this.totalSpace = 500; // 500GB total
        this.freeSpace = Math.round(
          this.totalSpace * (1 - this.diskUsage / 100)
        );
        this.diskUsedGB = this.totalSpace - this.freeSpace;

        // Simulate read/write speeds (random values for demo)
        this.readSpeed = Math.round(50 + Math.random() * 30); // 50-80 MB/s
        this.writeSpeed = Math.round(35 + Math.random() * 25); // 35-60 MB/s

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
    setTimeout(() => (this.loading = false), 500);
  }

  private initializeChart(): void {
    if (!this.chartContainer) return;

    const element = this.chartContainer.nativeElement;
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    // Create SVG
    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    this.pieGroup = this.svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    this.updateChart();
  }

  private updateChart(): void {
    if (!this.svg) return;

    const element = this.chartContainer.nativeElement;
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    // Calculate the radius
    // Remove unused variable or use it
    const chartRadius = Math.min(width, height) / 2 - 20;

    // Create pie data
    const pieData = [
      { label: 'Used', value: this.diskUsage },
      { label: 'Free', value: 100 - this.diskUsage },
    ];

    // Define pie layout
    const pie = d3
      .pie<{ label: string; value: number }>()
      .value((d) => d.value)
      .sort(null);

    // Define arc
    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(chartRadius * 0.6) // Make it a donut chart
      .outerRadius(chartRadius);

    // Generate arcs
    const arcs = pie(pieData);

    // Create or update paths
    const paths = this.pieGroup.selectAll('path').data(arcs);

    // Remove old paths
    paths.exit().remove();

    // Update existing paths
    paths
      .attr('d', arc)
      .style('fill', (d, i) => (i === 0 ? '#e74c3c' : '#ecf0f1'));

    // Add new paths
    paths
      .enter()
      .append('path')
      .attr('d', arc)
      .style('fill', (d, i) => (i === 0 ? '#e74c3c' : '#ecf0f1'));

    // Update center text
    const centerText = this.pieGroup.selectAll('text').data([this.diskUsage]);

    centerText.exit().remove();

    centerText
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', '#e74c3c')
      .text((d) => `${Math.round(d)}%`);

    centerText
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', '#e74c3c')
      .text((d) => `${Math.round(d)}%`);
  }
}

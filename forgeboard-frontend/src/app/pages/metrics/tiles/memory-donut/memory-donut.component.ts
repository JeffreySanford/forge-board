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
import { Tile } from '@forge-board/shared/api-interfaces';

// Define interface for the arc data that includes the needed properties
interface DonutArcData {
  data: number;
  value: number;
  index: number;
  startAngle: number;
  endAngle: number;
  padAngle: number;
}

@Component({
  selector: 'app-memory-donut',
  templateUrl: './memory-donut.component.html',
  styleUrls: ['./memory-donut.component.scss'],
  standalone: false,
})
export class MemoryDonutComponent
  implements OnInit, OnDestroy, AfterViewInit, Tile
{
  @ViewChild('chart') private chartContainer!: ElementRef;

  // Tile interface implementation
  position: number = 0;
  id: string = 'memory-donut';
  type = 'metrics' as const; // Fixed: Use as const instead of literal type annotation
  title = 'Memory Usage';
  order: number = 2;
  visible: boolean = true;

  subtitle = 'RAM allocation';
  icon = 'memory';
  loading = true;

  // Add missing properties referenced in the template
  memoryUsedFormatted = '0 GB';
  memoryFreeFormatted = '0 GB';

  // Use proper types for D3 selections and generators
  private svg!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private arc!: d3.Arc<number, DonutArcData>;
  private pie!: d3.Pie<number, number>; // Fixed: Use number instead of any
  private donut!: d3.Selection<SVGGElement, unknown, null, undefined>;

  private subscription = new Subscription();

  // Memory data
  memoryUsed = 0;
  memoryTotal = 0;
  memoryCurrent = 0;

  // Optional row and column properties
  row: number = 0;
  col: number = 0;

  constructor(private metricsService: MetricsService) {}

  ngOnInit(): void {
    this.memoryTotal = 16384; // 16GB in MB (mock data)

    this.subscription.add(
      this.metricsService.getMetricsStream().subscribe((metrics) => {
        this.loading = false;

        // Get memory percentage
        this.memoryCurrent = metrics.memory || 0;

        // Calculate used memory in MB
        this.memoryUsed = Math.round(
          (this.memoryCurrent / 100) * this.memoryTotal
        );

        // Update formatted values
        this.memoryUsedFormatted = this.formatMemory(this.memoryUsed);
        this.memoryFreeFormatted = this.formatMemory(
          this.memoryTotal - this.memoryUsed
        );

        this.updateChart();
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeChart();
    }, 0);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  refresh(): void {
    this.loading = true;
    setTimeout(() => (this.loading = false), 500);
  }

  formatMemory(mb: number): string {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  }

  private initializeChart(): void {
    if (!this.chartContainer) return;

    const element = this.chartContainer.nativeElement;
    const width = element.offsetWidth || 200;
    const height = element.offsetHeight || 200;
    const radius = Math.min(width, height) / 2 - 10;

    // Clear any existing SVG
    d3.select(element).selectAll('svg').remove();

    // Create new SVG
    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr(
        'transform',
        `translate(${width / 2},${height / 2})`
      ) as d3.Selection<SVGGElement, unknown, null, undefined>;

    // Create arc generator
    this.arc = d3
      .arc<number, DonutArcData>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    // Create pie layout
    this.pie = d3
      .pie<number>()
      .sort(null)
      .value((d) => d);

    // Create the donut chart group
    this.donut = this.svg.append('g');

    // Initial update
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.donut || !this.svg || !this.arc || !this.pie) return;

    // Wrap arc and pie generators to avoid 'this' context methods
    const arcGenerator = (d: DonutArcData): string =>
      this.arc.call(0 as any, d) ?? '';
    const pieGenerator = (vals: number[]): DonutArcData[] =>
      this.pie.call(0 as any, vals) as DonutArcData[];

    const data: number[] = [
      this.memoryUsed,
      this.memoryTotal - this.memoryUsed,
    ];
    const arcs = pieGenerator(data);
    const paths = this.donut
      .selectAll<SVGPathElement, DonutArcData>('path')
      .data(arcs);

    paths.exit().remove();

    paths
      .attr('d', (d: DonutArcData) => arcGenerator(d))
      .attr('fill', (_d: DonutArcData, i: number) =>
        i === 0 ? '#ffe066' : '#ecf0f1'
      );

    paths
      .enter()
      .append('path')
      .attr('d', (d: DonutArcData) => arcGenerator(d))
      .attr('fill', (_d: DonutArcData, i: number) =>
        i === 0 ? '#ffe066' : '#ecf0f1'
      )
      .transition()
      .duration(750)
      .attrTween('d', function (this: SVGPathElement, d: DonutArcData) {
        const interpolate = d3.interpolate<DonutArcData>(
          { startAngle: 0, endAngle: 0 } as DonutArcData,
          d
        );
        return (t: number) => arcGenerator(interpolate(t));
      });

    this.updateCenterText();
  }

  private updateCenterText(): void {
    // Remove existing text
    this.donut.selectAll('text').remove();

    // Add percentage text
    this.donut
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '28px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ffe066')
      .text(`${Math.round(this.memoryCurrent)}%`);

    // Add label text
    this.donut
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '3em')
      .attr('font-size', '12px')
      .attr('fill', '#ecf0f1')
      .text(`${this.memoryUsedFormatted} used`);
  }
}

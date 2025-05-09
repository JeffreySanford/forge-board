import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { 
  MetricsDataPoint, 
  MetricsSeries, 
  MetricsInterval
} from '@forge-board/shared/api-interfaces';

// Define Chart.js types to avoid using any
interface ChartDataset {
  label: string;
  data: Array<{x: Date, y: number}>;
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  pointRadius: number;
  pointHoverRadius: number;
  pointHitRadius: number;
  fill: boolean;
  tension: number;
}

interface ChartConfiguration {
  type: string;
  data: {
    datasets: ChartDataset[];
  };
  options: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    animation: boolean | {
      duration: number;
      easing: string;
    };
    scales: Record<string, unknown>;
    plugins: Record<string, unknown>;
  };
}

interface ChartInstance {
  config: ChartConfiguration;
  data: {
    datasets: ChartDataset[];
  };
  options: ChartConfiguration['options'];
  update: () => void;
  destroy: () => void;
  resize: () => void;
}

// Declare Chart.js to avoid TypeScript errors
declare const Chart: {
  new (ctx: CanvasRenderingContext2D, config: ChartConfiguration): ChartInstance;
};

@Component({
  selector: 'app-historical-metrics-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    FormsModule
  ],
  template: `
    <div class="metrics-chart-container">
      <div class="chart-header">
        <h3>{{title}}</h3>
        <div class="chart-controls">
          <mat-form-field appearance="outline" class="interval-select">
            <mat-label>Interval</mat-label>
            <mat-select [(ngModel)]="selectedInterval" (selectionChange)="onIntervalChange()">
              <mat-option value="1m">1 Minute</mat-option>
              <mat-option value="5m">5 Minutes</mat-option>
              <mat-option value="15m">15 Minutes</mat-option>
              <mat-option value="1h">1 Hour</mat-option>
              <mat-option value="6h">6 Hours</mat-option>
              <mat-option value="1d">1 Day</mat-option>
              <mat-option value="7d">7 Days</mat-option>
              <mat-option value="30d">30 Days</mat-option>
            </mat-select>
          </mat-form-field>
          
          <button mat-icon-button matTooltip="Toggle chart type" (click)="toggleChartType()">
            <mat-icon>bar_chart</mat-icon>
          </button>
          
          <button mat-icon-button matTooltip="Toggle animations" (click)="toggleAnimations()">
            <mat-icon>animation</mat-icon>
          </button>
          
          <button mat-icon-button matTooltip="Download data" (click)="downloadData()">
            <mat-icon>download</mat-icon>
          </button>
        </div>
      </div>
      
      <div class="chart-container" [class.loading]="isLoading">
        <canvas #chartCanvas></canvas>
        <div *ngIf="isLoading" class="loading-overlay">
          <mat-icon>hourglass_empty</mat-icon>
          <span>Loading data...</span>
        </div>
      </div>
      
      <div class="chart-legend" *ngIf="showLegend && series && series.length > 0">
        <div class="legend-item" *ngFor="let item of series" 
             [style.border-left-color]="item.color || '#999'">
          <span class="legend-name">{{item.name}}</span>
          <span class="legend-value">
            {{getLatestValue(item) | number:'1.1-1'}} {{item.unit}}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics-chart-container {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 16px;
      margin-bottom: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .chart-header h3 {
      margin: 0;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }
    
    .chart-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .interval-select {
      width: 100px;
      margin-bottom: -1.25em;
    }
    
    .chart-container {
      position: relative;
      flex: 1;
      min-height: 250px;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10;
    }
    
    .loading-overlay mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      animation: spin 1.5s linear infinite;
      color: #1976d2;
    }
    
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
    
    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      margin-top: 16px;
      gap: 12px;
    }
    
    .legend-item {
      padding: 4px 8px;
      border-left: 4px solid #ccc;
      background: #f5f5f5;
      font-size: 12px;
      border-radius: 0 4px 4px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .legend-name {
      font-weight: 500;
    }
    
    .legend-value {
      color: #555;
    }
  `]
})
export class HistoricalMetricsChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() title = 'Historical Metrics';
  @Input() series: MetricsSeries[] = [];
  @Input() isLoading = false;
  @Input() showLegend = true;
  @Input() initialInterval: MetricsInterval = '1h';
  
  // Visual configuration
  @Input() chartType: 'line' | 'bar' | 'area' = 'line';
  @Input() showAnimations = true;
  @Input() colorScheme = 'standard';
  
  // Event handling
  @Input() intervalChange = new BehaviorSubject<MetricsInterval>('1h');
  
  // Internal properties
  selectedInterval: MetricsInterval = '1h';
  private chart: ChartInstance | null = null;
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  private colorPalettes = {
    standard: ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8E24AA', '#16A2D7', '#FB8C00', '#00897B'],
    patriotic: ['#002868', '#BF0A30', '#F0F0F0', '#3C3B6E', '#B22234', '#FFFFFF', '#0A3161', '#D62828'],
    accessible: ['#003f5c', '#58508d', '#bc5090', '#ff6361', '#ffa600', '#8cc63f', '#00a9b5', '#4d4d4d']
  };
  
  @HostListener('window:resize')
  onResize() {
    // Debounce resize event
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      if (this.chart) {
        this.chart.resize();
      }
    }, 250);
  }
  
  ngOnInit(): void {
    this.selectedInterval = this.initialInterval;
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['series'] && this.chartCanvas) {
      this.updateChart();
    }
    
    if (changes['initialInterval'] && !changes['initialInterval'].firstChange) {
      this.selectedInterval = this.initialInterval;
    }
    
    if (changes['colorScheme'] && !changes['colorScheme'].firstChange) {
      this.validateColorScheme();
      this.updateChart();
    }
  }
  
  ngAfterViewInit(): void {
    if (this.series) {
      this.createChart();
    }
  }
  
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }
  
  private validateColorScheme(): void {
    if (!this.colorScheme || !(this.colorScheme in this.colorPalettes)) {
      console.warn(`Invalid color scheme '${this.colorScheme}', falling back to 'standard'`);
      this.colorScheme = 'standard';
    }
  }
  
  createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.validateColorScheme();
    
    const colors = this.colorPalettes[this.colorScheme as keyof typeof this.colorPalettes];
    
    const validatedSeries = this.validateSeriesData();
    
    const datasets: ChartDataset[] = validatedSeries.map((series, index) => {
      const color = series.color || colors[index % colors.length];
      
      return {
        label: series.name,
        data: series.data.map(point => ({
          x: new Date(point.timestamp),
          y: point.value
        })),
        borderColor: color,
        backgroundColor: this.chartType === 'area' ? 
          this.hexToRgba(color, 0.2) : color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 10,
        fill: this.chartType === 'area',
        tension: 0.4
      };
    });
    
    const config: ChartConfiguration = {
      type: this.chartType === 'area' ? 'line' : this.chartType,
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: this.showAnimations ? {
          duration: 1000,
          easing: 'easeOutQuart'
        } : false,
        scales: {
          x: {
            type: 'time',
            time: {
              tooltipFormat: 'MMM d, yyyy, HH:mm:ss',
              displayFormats: {
                millisecond: 'HH:mm:ss.SSS',
                second: 'HH:mm:ss',
                minute: 'HH:mm',
                hour: 'MMM d, HH:mm',
                day: 'MMM d',
                week: 'MMM d',
                month: 'MMM yyyy',
                quarter: 'MMM yyyy',
                year: 'yyyy'
              }
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              pinch: {
                enabled: true
              },
              mode: 'x'
            }
          }
        }
      }
    };
    
    this.chart = new Chart(ctx, config);
  }
  
  private validateSeriesData(): MetricsSeries[] {
    if (!this.series || !Array.isArray(this.series)) {
      console.warn('Invalid metrics series data, using empty array');
      return [];
    }
    
    return this.series.filter(series => {
      if (!series) {
        console.warn('Found null or undefined series item, skipping');
        return false;
      }
      
      if (!Array.isArray(series.data)) {
        console.warn(`Series "${series.name}" has invalid data, skipping`);
        return false;
      }
      
      if (series.data.length === 0) {
        console.warn(`Series "${series.name}" has empty data, including anyway`);
        return true;
      }
      
      return true;
    });
  }
  
  updateChart(): void {
    if (!this.chart) {
      this.createChart();
      return;
    }
    
    this.validateColorScheme();
    const colors = this.colorPalettes[this.colorScheme as keyof typeof this.colorPalettes];
    const validatedSeries = this.validateSeriesData();
    
    this.chart.data.datasets = validatedSeries.map((series, index) => {
      const color = series.color || colors[index % colors.length];
      
      return {
        label: series.name,
        data: series.data.map((point: MetricsDataPoint) => ({
          x: new Date(point.timestamp),
          y: point.value
        })),
        borderColor: color,
        backgroundColor: this.chartType === 'area' ? 
          this.hexToRgba(color, 0.2) : color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 10,
        fill: this.chartType === 'area',
        tension: 0.4
      };
    });
    
    this.chart.update();
  }
  
  toggleChartType(): void {
    const types = ['line', 'area', 'bar'];
    const currentIndex = types.indexOf(this.chartType);
    const nextIndex = (currentIndex + 1) % types.length;
    this.chartType = types[nextIndex] as 'line' | 'bar' | 'area';
    
    if (this.chart) {
      if (this.chartType === 'area') {
        this.chart.config.type = 'line';
        this.chart.data.datasets.forEach((dataset: ChartDataset) => {
          dataset.fill = true;
        });
      } else {
        this.chart.config.type = this.chartType;
        this.chart.data.datasets.forEach((dataset: ChartDataset) => {
          dataset.fill = false;
        });
      }
      
      this.chart.update();
    }
  }
  
  toggleAnimations(): void {
    this.showAnimations = !this.showAnimations;
    
    if (this.chart) {
      this.chart.options.animation = this.showAnimations ? {
        duration: 1000,
        easing: 'easeOutQuart'
      } : false;
      
      this.chart.update();
    }
  }
  
  onIntervalChange(): void {
    this.intervalChange.next(this.selectedInterval);
  }
  
  downloadData(): void {
    if (!this.series || this.series.length === 0) return;
    
    // Prepare CSV content
    let csv = 'Series,Timestamp,Value,Unit\n';
    
    this.series.forEach((series: MetricsSeries) => {
      series.data.forEach((point: MetricsDataPoint) => {
        csv += `${series.name},${point.timestamp},${point.value},${series.unit}\n`;
      });
    });
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  getLatestValue(series: MetricsSeries): number {
    if (!series.data || series.data.length === 0) return 0;
    return series.data[series.data.length - 1].value;
  }
  
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

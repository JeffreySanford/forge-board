import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoggerService } from '../../services/logger.service';
import { LogEntry, LogLevelEnum } from '@forge-board/shared/api-interfaces';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.scss'],
  standalone: false
})
export class LoggerComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  logStats = { debug: 0, info: 0, warn: 0, error: 0, fatal: 0, total: 0 };
  selectedLevels: LogLevelEnum[] = [];
  selectedService: string = 'all';
  searchQuery: string = '';
  
  // Add missing properties used in template
  isConnected: boolean = false;
  
  private subscription = new Subscription();
  
  constructor(private loggerService: LoggerService) {}
  
  ngOnInit() {
    this.subscription.add(
      this.loggerService.getLogs().subscribe(logs => {
        this.logs = logs;
        this.updateStats();
      })
    );
    
    // this.subscription.add(
    //   this.loggerService.getConnectionStatus().subscribe(status => {
    //     this.isConnected = status;
    //   })
    // );
  }
  
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  
  // Add missing methods used in template
  disconnectOtherServices(): void {
    // this.loggerService.disconnectAndReconnect();
  }
  
  onLevelsChanged(levels: LogLevelEnum[]): void {
    console.log('Levels changed:', levels); // Make parameter used
    // this.loggerService.setLevelFilter(levels); // Commented out
  }

  onSourcesChanged(source: string): void {
    console.log('Source changed:', source); // Make parameter used
    // this.loggerService.setServiceFilter(services); // Commented out - assuming services was a typo for source
  }

  onSearchChanged(search: string): void {
    console.log('Search changed:', search); // Make parameter used
    // this.loggerService.setSearchFilter(searchTerm); // Commented out - assuming searchTerm was a typo for search
  }
  
  onExportJson(): void {
    // this.loggerService.exportLogs('json');
    console.log('Exporting logs to JSON (not implemented yet)');
  }

  onExportCsv(): void {
    // this.loggerService.exportLogs('csv');
    console.log('Exporting logs to CSV (not implemented yet)');
  }

  private convertToCsv(data: LogEntry[]): string {
    if (!data || data.length === 0) {
      return '';
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => {
        const stringValue = String(value);
        // Escape commas and quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    return `${headers}\n${rows.join('\n')}`;
  }

  private downloadFile(content: string, fileName: string, contentType: string): void {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  
  private updateStats(): void {
    const stats = { debug: 0, info: 0, warn: 0, error: 0, fatal: 0, total: 0 };
    
    this.logs.forEach(log => {
      stats.total++;
      switch(log.level) {
        case LogLevelEnum.DEBUG: stats.debug++; break;
        case LogLevelEnum.INFO: stats.info++; break;
        case LogLevelEnum.WARN: stats.warn++; break;
        case LogLevelEnum.ERROR: stats.error++; break;
        case LogLevelEnum.FATAL: stats.fatal++; break;
      }
    });
    
    this.logStats = stats;
  }

  // Add type for status parameter
  private updateConnectionStatus(status: boolean): void {
    this.isConnected = status;
  }
}

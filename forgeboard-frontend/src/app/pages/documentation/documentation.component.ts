import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DocumentationService, DocFile } from '../../services/documentation.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';

// Define interfaces for documentation content structure
interface DocSection {
  id: string;
  title: string;
  content: string;
  codeSnippets?: CodeSnippet[];
  subsections?: DocSubsection[];
  expanded?: boolean;
}

interface DocSubsection {
  id: string;
  title: string;
  content: string;
  codeSnippets?: CodeSnippet[];
}

interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
}

interface DocTab {
  label: string;
  content: string;
  sections?: DocSection[];
  icon?: string; // Material icon name
  expanded?: boolean;
  path?: string; // Path to markdown file
  isMarkdown?: boolean;
  renderedContent?: SafeHtml;
  loading?: boolean;
  files?: DocFile[]; // Associated files for this tab
  category?: string; // Category name if this tab represents a category
}

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss'],
  standalone: false
})
export class DocumentationComponent implements OnInit {
  // Dynamic tabs loaded from documentation service
  dynamicTabs: DocTab[] = [];
  // Loading state
  isLoading = true;
  // Error state
  loadError: string | null = null;  // Search query and results
  searchQuery = '';
  searchResults = new BehaviorSubject<{tab: string, section: string, subsection?: string, content: string}[]>([]);
  isSearching = false;
  // Active tab index
  activeTabIndex = 0;
  // Active section tracking
  activeSectionId: string | null = null;
  
  // Static tabs for backup and demonstration
  tabs: DocTab[] = [
    { 
      label: 'Overview', 
      icon: 'home',
      content: 'A modern monitoring and management dashboard with a blueprint-inspired engineering aesthetic.',
      sections: [
        {
          id: 'intro',
          title: 'Introduction',
          content: 'ForgeBoard is a comprehensive monitoring and management dashboard that combines real-time data visualization with project management capabilities. It features a unique blueprint-inspired engineering aesthetic that gives it a distinct visual identity.',
        },
        {
          id: 'architecture',
          title: 'Architecture Overview',
          content: 'The application is built using Angular for the frontend and NestJS for the backend. It utilizes WebSockets for real-time data transfer and follows a modular architecture for easy extensibility.',
          codeSnippets: [
            {
              language: 'typescript',
              code: `@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    // Feature modules
    KablanBoardModule,
    MetricsModule,
    // ...other modules
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }`,
              description: 'Main application module showing modular architecture'
            }
          ]
        },
        {
          id: 'features',
          title: 'Key Features',
          content: 'ForgeBoard offers several key features that make it a powerful monitoring and management tool:',
          subsections: [
            {
              id: 'realtime',
              title: 'Real-time Updates',
              content: 'All data is updated in real-time using WebSocket connections, ensuring you always have the latest information.'
            },
            {
              id: 'mock-data',
              title: 'Mock Data Support',
              content: 'When backend services are unavailable, the system automatically switches to using simulated data, ensuring the UI remains functional.'
            },
            {
              id: 'visualization',
              title: 'Data Visualization',
              content: 'Comprehensive charts and visual indicators make complex system data easy to understand at a glance.'
            }
          ]
        }
      ]
    },
    { 
      label: 'Home', 
      icon: 'dashboard',
      content: 'The dashboard home page provides quick access to all major features and system status information.',
      sections: [
        {
          id: 'home-overview',
          title: 'Home Dashboard',
          content: 'The home dashboard serves as the central hub for the application, providing quick access to all major features through a tile-based interface.'
        },
        {
          id: 'navigation',
          title: 'Navigation Structure',
          content: 'The main navigation provides easy access to all major sections of the application through a responsive sidebar that adapts to different screen sizes.'
        },
        {
          id: 'status-indicators',
          title: 'Status Indicators',
          content: 'The home page includes various status indicators that provide at-a-glance information about system health, connection status, and key metrics.'
        }
      ]
    },
    { 
      label: 'Metrics', 
      icon: 'timeline',
      content: 'Real-time system performance metrics with interactive charts and customizable refresh rates.',
      sections: [
        {
          id: 'metrics-overview',
          title: 'Metrics Dashboard',
          content: 'The metrics dashboard provides real-time monitoring of system performance through various charts and indicators.'
        },
        {
          id: 'metrics-types',
          title: 'Available Metrics',
          content: 'ForgeBoard tracks several key system metrics:',
          subsections: [
            {
              id: 'cpu',
              title: 'CPU Usage',
              content: 'Real-time monitoring of CPU utilization across the system.'
            },
            {
              id: 'memory',
              title: 'Memory Consumption',
              content: 'Tracking of memory usage with historical trends and threshold alerts.'
            },
            {
              id: 'network',
              title: 'Network Activity',
              content: 'Monitoring of network throughput, connections, and related metrics.'
            },
            {
              id: 'disk',
              title: 'Storage Usage',
              content: 'Monitoring of disk space usage and I/O performance.'
            }
          ]
        },
        {
          id: 'metrics-configuration',
          title: 'Metrics Configuration',
          content: 'Users can customize the refresh rate, display settings, and thresholds for metrics visualization.'
        }
      ]
    },
    { 
      label: 'Kablan Board', 
      icon: 'view_kanban',
      content: 'Kanban-style project management with phase-based workflow visualization and drag-and-drop card management.',
      sections: [
        {
          id: 'kablan-overview',
          title: 'Kablan Board Overview',
          content: 'The Kablan Board is a flexible visual task management tool that helps teams track and visualize work progress through customizable columns and cards.'
        },
        {
          id: 'board-features',
          title: 'Key Features',
          content: 'The board includes several key features:',
          subsections: [
            {
              id: 'drag-drop',
              title: 'Drag-and-Drop Interface',
              content: 'Easily move tasks between columns as work progresses.'
            },
            {
              id: 'priority-levels',
              title: 'Card Priority Levels',
              content: 'Assign low, medium, or high priority to cards for better task management.'
            },
            {
              id: 'phases',
              title: 'Phase-based Workflow',
              content: 'Organize columns into phases representing different stages of work (planning, development, testing, etc.).'
            }
          ]
        },
        {
          id: 'realtime-updates',
          title: 'Real-time Collaboration',
          content: 'All changes to the board are reflected in real-time across all connected clients, enabling seamless team collaboration.'
        }
      ]
    },
    { 
      label: 'Diagnostics', 
      icon: 'healing',
      content: 'Comprehensive system health monitoring and connection status tracking with timeline-based visualization.',
      sections: [
        {
          id: 'diagnostics-overview',
          title: 'Diagnostics Overview',
          content: 'The diagnostics module provides comprehensive tools for monitoring system health, connection status, and troubleshooting issues.'
        },
        {
          id: 'health-monitoring',
          title: 'Health Monitoring',
          content: 'Track system health with a timeline view showing past, present, and predicted future status.'
        },
        {
          id: 'connection-tracking',
          title: 'Connection Tracking',
          content: 'Monitor WebSocket connections, their status, and related metrics for optimal system performance.'
        },
        {
          id: 'type-diagnostics',
          title: 'Type Validation Diagnostics',
          content: 'Advanced diagnostics for runtime type validation to ensure data integrity across the application.'
        }
      ]
    },
    { 
      label: 'Logger', 
      icon: 'receipt_long',
      content: 'Advanced log collection and management with filtering, searching, and export capabilities.',
      sections: [
        {
          id: 'logger-overview',
          title: 'Logger Overview',
          content: 'The logging system collects, categorizes, and displays log entries from various parts of the application.'
        },
        {
          id: 'log-filtering',
          title: 'Log Filtering',
          content: 'Filter logs by severity level, source component, time range, and text content to quickly find relevant information.'
        },
        {
          id: 'log-export',
          title: 'Export Capabilities',
          content: 'Export logs to CSV format for further analysis or record-keeping.'
        },
        {
          id: 'log-levels',
          title: 'Log Levels',
          content: 'Logs are categorized by severity:',
          subsections: [
            {
              id: 'debug',
              title: 'Debug',
              content: 'Detailed debugging information, typically only enabled during development.'
            },
            {
              id: 'info',
              title: 'Info',
              content: 'General information about system operation.'
            },
            {
              id: 'warning',
              title: 'Warning',
              content: 'Potential issues that don\'t prevent normal operation but should be addressed.'
            },
            {
              id: 'error',
              title: 'Error',
              content: 'Problems that prevent normal operation of specific features.'
            },
            {
              id: 'critical',
              title: 'Critical',
              content: 'Severe issues that may cause system instability or failure.'
            }
          ]
        }
      ]
    },
    { 
      label: 'API', 
      icon: 'code',
      content: 'Documentation for available REST endpoints and WebSocket namespaces.',
      sections: [
        {
          id: 'api-overview',
          title: 'API Overview',
          content: 'ForgeBoard uses a combination of REST APIs and WebSocket connections for real-time data exchange.'
        },
        {
          id: 'rest-endpoints',
          title: 'REST Endpoints',
          content: 'The following REST endpoints are available:',
          subsections: [
            {
              id: 'metrics-api',
              title: 'Metrics API',
              content: 'Endpoints for fetching and configuring system metrics.',
              codeSnippets: [
                {
                  language: 'typescript',
                  code: `// Get current metrics
GET /api/metrics

// Set metrics interval
GET /api/metrics/set-interval?interval=500

// Register new metrics
POST /api/metrics/register
{
  "cpu": 45.2,
  "memory": 62.8,
  "disk": 55.1,
  "network": 32.5,
  "time": "2023-07-15T12:34:56Z"
}`,
                  description: 'Metrics API endpoints'
                }
              ]
            },
            {
              id: 'diagnostics-api',
              title: 'Diagnostics API',
              content: 'Endpoints for system health and diagnostics information.'
            },
            {
              id: 'kablan-api',
              title: 'Kablan API',
              content: 'Endpoints for managing the project board, columns, and cards.'
            },
            {
              id: 'logs-api',
              title: 'Logger API',
              content: 'Endpoints for log retrieval, filtering, and management.'
            }
          ]
        },
        {
          id: 'websocket-namespaces',
          title: 'WebSocket Namespaces',
          content: 'The following WebSocket namespaces are available:',
          subsections: [
            {
              id: 'metrics-ws',
              title: 'Metrics Namespace',
              content: 'Real-time system metric updates through `/metrics` namespace.'
            },
            {
              id: 'diagnostics-ws',
              title: 'Diagnostics Namespace',
              content: 'System health and socket diagnostics through `/diagnostics` namespace.'
            },
            {
              id: 'kablan-ws',
              title: 'Kablan Namespace',
              content: 'Real-time board updates through `/kablan` namespace.'
            }
          ]
        }
      ]
    },
  ];
  
  constructor(
    private docService: DocumentationService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadDocumentation();
    
    // Check for query params to navigate to specific documentation
    this.route.queryParams.subscribe(params => {
      const category = params['category'];
      const file = params['file'];
      
      if (category) {
        // Find or create tab for this category
        this.navigateToCategory(category);
      }
      
      if (file) {
        // Load specific file
        this.loadDocumentationFile(file);
      }
    });
  }
  
  /**
   * Load documentation from service
   */
  loadDocumentation(): void {
    this.isLoading = true;
    
    // Load categories first
    this.docService.getDocumentationCategories()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (categories) => {
          // Create tabs from categories
          this.dynamicTabs = categories.map(category => {
            return {
              label: category.title,
              icon: this.getCategoryIcon(category.name),
              content: `${category.title} documentation`,
              category: category.name,
              files: category.files,
              isMarkdown: false
            };
          });
          
          // Add links to README.md and main docs
          this.loadMainReadme();
        },
        error: (err) => {
          console.error('Failed to load documentation categories', err);
          this.loadError = 'Failed to load documentation. Using static content instead.';
        }
      });
  }
  
  /**
   * Load README.md as the first tab
   */
  loadMainReadme(): void {
    this.docService.getDocumentationByPath('/README.md')
      .subscribe({
        next: (content) => {
          // Add README as first tab
          this.dynamicTabs.unshift({
            label: 'README',
            icon: 'description',
            content: '',
            isMarkdown: true,
            renderedContent: this.sanitizer.bypassSecurityTrustHtml(this.markdownToHtml(content)),
            path: '/README.md'
          });
        },
        error: () => {
          // If README.md not found at root, try in assets/documentation
          this.docService.getDocumentationByPath('README.md')
            .subscribe(content => {
              this.dynamicTabs.unshift({
                label: 'README',
                icon: 'description',
                content: '',
                isMarkdown: true,
                renderedContent: this.sanitizer.bypassSecurityTrustHtml(this.markdownToHtml(content)),
                path: 'README.md'
              });
            });
        }
      });
  }
  
  /**
   * Get a material icon name for a category
   */
  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'general': 'home',
      'developer': 'code',
      'security': 'security',
      'FedRAMP': 'verified',
      'marketing': 'campaign',
      'small-business': 'business'
    };
    
    return iconMap[category] || 'article';
  }
  
  /**
   * Load a specific documentation file
   */
  loadDocumentationFile(filename: string): void {
    const tab = this.dynamicTabs.find(t => t.files?.some(f => f.name === filename));
    
    if (tab) {
      // Navigate to tab
      const tabIndex = this.dynamicTabs.indexOf(tab);
      if (tabIndex >= 0) {
        this.activeTabIndex = tabIndex;
      }
      
      // Load file content
      this.docService.getDocumentationByName(filename)
        .subscribe(content => {
          tab.renderedContent = this.sanitizer.bypassSecurityTrustHtml(this.markdownToHtml(content));
          tab.isMarkdown = true;
        });
    } else {
      // Try to load directly
      this.docService.getDocumentationByName(filename)
        .subscribe(content => {
          // Create new tab
          const newTab: DocTab = {
            label: this.formatFilenameAsTitle(filename),
            icon: 'description',
            content: '',
            isMarkdown: true,
            renderedContent: this.sanitizer.bypassSecurityTrustHtml(this.markdownToHtml(content)),
            path: filename
          };
          
          this.dynamicTabs.push(newTab);
          this.activeTabIndex = this.dynamicTabs.length - 1;
        });
    }
  }
  
  /**
   * Navigate to a specific category
   */
  navigateToCategory(categoryName: string): void {
    const tab = this.dynamicTabs.find(t => t.category === categoryName);
    
    if (tab) {
      const tabIndex = this.dynamicTabs.indexOf(tab);
      if (tabIndex >= 0) {
        this.activeTabIndex = tabIndex;
      }
    }
  }
  
  /**
   * Format a filename as a title
   */
  formatFilenameAsTitle(filename: string): string {
    // Remove extension
    let title = filename.replace(/\.[^/.]+$/, "");
    // Replace dashes and underscores with spaces
    title = title.replace(/[_-]/g, ' ');
    // Title case
    return title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  /**
   * Simple markdown to HTML conversion
   * In a real app, use a proper markdown library like marked
   */
  markdownToHtml(markdown: string): string {
    if (!markdown) return '';
    
    // This is a simple placeholder implementation
    // In production, use a library like marked.js
    let html = markdown;
    
    // Headers
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    
    // Code blocks
    html = html.replace(/```(\w*)([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // Inline code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Lists
    html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/<li>.*?<\/li>(?=\n<li>)/g, match => {
      return '<ul>' + match;
    });
    html = html.replace(/<\/li>(?!\n<li>)/g, '</li></ul>');
    
    // Paragraphs
    html = html.replace(/^(?!<[a-z]).+/gm, '<p>$&</p>');
    
    return html;
  }

  /**
   * Handle tab selection change
   */
  onTabChange(index: number): void {
    this.activeTabIndex = index;
    this.activeSectionId = null;
    
    // Update URL with current tab
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: this.tabs[index].label.toLowerCase() },
      queryParamsHandling: 'merge'
    });
  }
  
  /**
   * Toggle section expansion
   */
  toggleSection(section: DocSection): void {
    section.expanded = !section.expanded;
  }
  
  /**
   * Navigate to a specific section
   */
  navigateToSection(sectionId: string): void {
    this.activeSectionId = sectionId;
    this.scrollToSection(sectionId);
    
    // Update URL with section
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: sectionId },
      queryParamsHandling: 'merge'
    });
  }
  
  /**
   * Scroll to a section by ID
   */
  private scrollToSection(sectionId: string | null): void {
    if (!sectionId) return; // Add null check to fix type error
    
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
  
  /**
   * Search documentation
   */
  searchDocumentation(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults.next([]);
      this.isSearching = false;
      return;
    }
    
    this.isSearching = true;
    const query = this.searchQuery.toLowerCase();
    const results: {tab: string, section: string, subsection?: string, content: string}[] = [];
    
    // Search through all tabs, sections, and subsections
    this.tabs.forEach(tab => {
      if (!tab.sections) return;
      
      tab.sections.forEach(section => {
        // Check section content
        if (section.content.toLowerCase().includes(query)) {
          results.push({
            tab: tab.label,
            section: section.title,
            content: this.highlightSearchText(section.content, query)
          });
        }
        
        // Check subsections
        section.subsections?.forEach(subsection => {
          if (subsection.content.toLowerCase().includes(query)) {
            results.push({
              tab: tab.label,
              section: section.title,
              subsection: subsection.title,
              content: this.highlightSearchText(subsection.content, query)
            });
          }
        });
        
        // Check code snippets
        section.codeSnippets?.forEach(snippet => {
          if ((snippet.code.toLowerCase().includes(query)) || 
              (snippet.description?.toLowerCase().includes(query) ?? false)) {
            results.push({
              tab: tab.label,
              section: section.title,
              content: `Code snippet: ${snippet.description || 'Unnamed snippet'}`
            });
          }
        });
      });
    });
    
    this.searchResults.next(results);
  }
  
  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults.next([]);
    this.isSearching = false;
  }
  
  /**
   * Navigate to search result
   */
  navigateToResult(result: {tab: string, section: string, subsection?: string}): void {
    // Find tab index
    const tabIndex = this.tabs.findIndex(tab => tab.label === result.tab);
    if (tabIndex >= 0) {
      this.activeTabIndex = tabIndex;
      
      // Find section
      const tab = this.tabs[tabIndex];
      const section = tab.sections?.find(s => s.title === result.section);
      if (section) {
        this.navigateToSection(section.id);
      }
    }
    
    this.clearSearch();
  }
  
  /**
   * Highlight search text in content
   */
  private highlightSearchText(content: string, query: string): string {
    // Simple highlight by truncating text around match
    const index = content.toLowerCase().indexOf(query);
    if (index === -1) return content;
    
    const start = Math.max(0, index - 30);
    const end = Math.min(content.length, index + query.length + 30);
    let result = content.substring(start, end);
    
    if (start > 0) result = '...' + result;
    if (end < content.length) result = result + '...';
    
    return result;
  }
}

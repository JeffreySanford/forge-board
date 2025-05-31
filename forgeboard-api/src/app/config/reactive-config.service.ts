import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { BehaviorSubject, Observable, of, timer, Subscription } from 'rxjs';
import { shareReplay, tap, switchMap, catchError } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';

export interface AppConfig {
  version: string;
  environment: string;
  features: {
    metrics: boolean;
    logging: boolean;
    socketIo: boolean;
    security: boolean;
    [key: string]: boolean;
  };
  refreshIntervalMs: number;
  lastUpdated: string;
}

/**
 * Reactive configuration service using hot observables
 *
 * Features:
 * - Manages application configuration as hot observable streams
 * - Uses BehaviorSubject to provide current value to new subscribers
 * - Auto-refreshes configuration from file or external source
 * - Notifies subscribers of configuration changes
 */
@Injectable()
export class ReactiveConfigService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReactiveConfigService.name);

  /**
   * BehaviorSubject to track configuration as a hot observable
   * Initialized with default config and emits to all subscribers
   */
  private configSubject = new BehaviorSubject<AppConfig>({
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      metrics: true,
      logging: true,
      socketIo: true,
      security: true,
    },
    refreshIntervalMs: 30000, // 30 seconds
    lastUpdated: new Date().toISOString(),
  });

  /**
   * Hot observable of configuration
   * Uses shareReplay(1) to ensure all new subscribers get the latest value
   */
  public config$: Observable<AppConfig> = this.configSubject
    .asObservable()
    .pipe(shareReplay(1));

  // Derived observables for specific config values
  public environment$: Observable<string> = this.config$.pipe(
    map((config) => (config as AppConfig).environment),
    shareReplay(1)
  );

  public features$: Observable<AppConfig['features']> = this.config$.pipe(
    map((config) => (config as AppConfig).features),
    shareReplay(1)
  );

  private refreshSubscription: Subscription | null = null;
  private configPath = path.join(process.cwd(), 'config', 'app-config.json');

  constructor() {
    this.logger.log(
      'ReactiveConfigService initialized with BehaviorSubject state management'
    );
  }

  onModuleInit(): void {
    this.loadConfigFromFile();
    this.startAutoRefresh();
  }

  onModuleDestroy(): void {
    this.logger.log('ReactiveConfigService cleaning up resources');
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    this.configSubject.complete();
  }

  /**
   * Get current configuration value synchronously
   */
  public getCurrentConfig(): AppConfig {
    return this.configSubject.getValue();
  }

  /**
   * Update a feature flag and notify all subscribers
   * @param featureName The feature to update
   * @param enabled Whether the feature is enabled
   */
  public setFeatureFlag(
    featureName: string,
    enabled: boolean
  ): Observable<AppConfig> {
    const currentConfig = this.configSubject.getValue();

    const updatedConfig: AppConfig = {
      ...currentConfig,
      features: {
        ...currentConfig.features,
        [featureName]: enabled,
      },
      lastUpdated: new Date().toISOString(),
    };

    this.configSubject.next(updatedConfig);
    this.logger.verbose(`Feature flag updated: ${featureName} = ${enabled}`);

    return of(updatedConfig);
  }

  /**
   * Update the refresh interval
   * @param intervalMs New interval in milliseconds
   */
  public setRefreshInterval(intervalMs: number): Observable<number> {
    // Update config
    const currentConfig = this.configSubject.getValue();
    const updatedConfig = {
      ...currentConfig,
      refreshIntervalMs: intervalMs,
      lastUpdated: new Date().toISOString(),
    };

    this.configSubject.next(updatedConfig);

    // Restart refresh timer with new interval
    this.startAutoRefresh();

    this.logger.verbose(`Config refresh interval updated: ${intervalMs}ms`);
    return of(intervalMs);
  }

  /**
   * Save current configuration to file
   */
  public saveConfigToFile(): Observable<boolean> {
    const currentConfig = this.configSubject.getValue();

    try {
      // Ensure directory exists
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.configPath,
        JSON.stringify(currentConfig, null, 2),
        'utf8'
      );

      this.logger.log(`Configuration saved to ${this.configPath}`);
      return of(true);
    } catch (error) {
      this.logger.error(`Failed to save configuration: ${error.message}`);
      return of(false);
    }
  }

  private loadConfigFromFile(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContent = fs.readFileSync(this.configPath, 'utf8');
        const fileConfig = JSON.parse(fileContent);

        // Merge with defaults to ensure all properties exist
        const currentConfig = this.configSubject.getValue();
        const mergedConfig: AppConfig = {
          ...currentConfig,
          ...fileConfig,
          features: {
            ...currentConfig.features,
            ...(fileConfig.features || {}),
          },
          lastUpdated: new Date().toISOString(),
        };

        this.configSubject.next(mergedConfig);
        this.logger.log(`Configuration loaded from ${this.configPath}`);
      } else {
        this.logger.warn(
          `Config file not found at ${this.configPath}, using defaults`
        );
      }
    } catch (error) {
      this.logger.error(`Failed to load configuration: ${error.message}`);
    }
  }

  private startAutoRefresh(): void {
    // Clean up existing subscription
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }

    const intervalMs = this.configSubject.getValue().refreshIntervalMs;

    this.refreshSubscription = timer(intervalMs, intervalMs)
      .pipe(
        tap(() => this.logger.verbose('Checking for configuration updates...')),
        switchMap(() => {
          // This is where you would check for updated config from a remote source
          // For this example, we'll just reload from file
          return of(this.loadConfigFromFile()).pipe(
            catchError((error) => {
              this.logger.error(`Config refresh error: ${error.message}`);
              return of(null);
            })
          );
        })
      )
      .subscribe();

    this.logger.log(`Auto-refresh started: checking every ${intervalMs}ms`);
  }
}

// Missing import - adding here
function map<T, R>(
  project: (value: T) => R
): (source: Observable<T>) => Observable<R> {
  return (source: Observable<T>): Observable<R> =>
    new Observable<R>((subscriber) =>
      source.subscribe({
        next(value) {
          try {
            subscriber.next(project(value));
          } catch (err) {
            subscriber.error(err);
          }
        },
        error(err) {
          subscriber.error(err);
        },
        complete() {
          subscriber.complete();
        },
      })
    );
}

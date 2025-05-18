import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Import service barrels
import * as authServices from './services/auth';
import * as monitoringServices from './services/monitoring';
import * as socketServices from './services/socket';
import * as stateServices from './services/state';
import * as uiServices from './services/ui';
import * as utilServices from './services/utils';

/**
 * Core module that provides singleton services for the application
 */
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    // Spread all services from barrels
    ...Object.values(authServices),
    ...Object.values(monitoringServices),
    ...Object.values(socketServices),
    ...Object.values(stateServices),
    ...Object.values(uiServices),
    ...Object.values(utilServices)
  ]
})
export class CoreModule {
  /**
   * Prevent multiple instances of the CoreModule
   */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it only in the AppModule.'
      );
    }
  }
}

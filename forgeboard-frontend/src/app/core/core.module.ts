import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketClientService } from './services/socket/socket-client.service';

/**
 * Core module that provides singleton services for the application
 */
@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    SocketClientService,
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

import { Injectable, Logger } from '@nestjs/common';
import { DocumentationService } from '../documentation/documentation.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DocumentationSeeder {
  private readonly logger = new Logger(DocumentationSeeder.name);

  constructor(private readonly docService: DocumentationService) {}

  /**
   * Seed documentation files into the database
   */
  async seed(): Promise<void> {
    this.logger.log('Seeding documentation files...');

    try {
      // Convert Observable to Promise using firstValueFrom (newer RxJS approach)
      const files = await firstValueFrom(this.docService.seedDocumentation());
      this.logger.log(
        `Successfully seeded ${files.length} documentation files`
      );
    } catch (error) {
      this.logger.error(`Failed to seed documentation: ${error.message}`);
    }
  }
}

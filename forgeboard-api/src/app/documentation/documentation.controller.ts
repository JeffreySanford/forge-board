import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

@Controller('docs')
export class DocumentationController {
  private readonly logger = new Logger(DocumentationController.name);
  private readonly docBasePath = path.join(
    process.cwd(),
    'forgeboard-frontend',
    'src',
    'assets',
    'documentation'
  );

  /**
   * Serve documentation file by path
   */
  @Get(':path(*)')
  async getDocumentation(
    @Param('path') docPath: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      // Sanitize path to prevent directory traversal
      const sanitizedPath = this.sanitizePath(docPath);
      const fullPath = path.join(this.docBasePath, sanitizedPath);

      this.logger.log(`Attempting to serve documentation: ${sanitizedPath}`);

      // Check if file exists and is within docs directory
      if (!this.isPathWithinDirectory(fullPath, this.docBasePath)) {
        this.logger.warn(`Attempted path traversal: ${docPath}`);
        throw new NotFoundException('Documentation not found');
      }

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        // Try adding .md extension if missing
        if (!fullPath.endsWith('.md')) {
          const pathWithExtension = `${fullPath}.md`;
          if (fs.existsSync(pathWithExtension)) {
            return this.serveDocFile(pathWithExtension, res);
          }
        }
        this.logger.warn(`Documentation file not found: ${fullPath}`);
        throw new NotFoundException('Documentation not found');
      }

      return this.serveDocFile(fullPath, res);
    } catch (error) {
      this.logger.error(
        `Error serving documentation: ${error.message}`,
        error.stack
      );
      res.status(HttpStatus.NOT_FOUND).json({
        status: 'error',
        message: 'Documentation not found or cannot be accessed',
      });
    }
  }

  /**
   * Serve the documentation file
   */
  private async serveDocFile(filePath: string, res: Response): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      res.set('Content-Type', 'text/markdown');
      res.status(HttpStatus.OK).send(content);
    } catch (error) {
      this.logger.error(
        `Error reading documentation file: ${error.message}`,
        error.stack
      );
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Error reading documentation file',
      });
    }
  }

  /**
   * Sanitize path to prevent directory traversal
   */
  private sanitizePath(docPath: string): string {
    // Remove leading slashes and normalize path
    return path.normalize(docPath.replace(/^\/+/, ''));
  }

  /**
   * Ensure path is within the allowed directory
   */
  private isPathWithinDirectory(filePath: string, directory: string): boolean {
    const relative = path.relative(directory, filePath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
  }
}

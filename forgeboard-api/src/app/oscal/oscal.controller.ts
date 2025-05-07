import { Controller, Get, Post, Param, Query, UseGuards, Req, Res, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { LoggerService } from '../common/logger.service';
import { AuditService } from '../security/audit.service';
import { OscalService, OscalDocument, OscalTemplate, OscalBaseline, ValidationResult } from './oscal.service';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Response } from 'express';

interface QueryParams {
  type?: string;
  limit?: number;
  offset?: number;
}

interface RequestWithUser {
  user: {
    id: string;
    username?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    [key: string]: unknown;  // Using 'unknown' instead of 'any' for better type safety
  };
}

@Controller('api/oscal')
export class OscalController {
  constructor(
    private oscalService: OscalService,
    private logger: LoggerService,
    private auditService: AuditService
  ) {}

  @Get('documents')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('oscal:read')
  getDocuments(@Req() req: RequestWithUser, @Query() query: QueryParams): Observable<OscalDocument[]> {
    const { user } = req;
    const { type, limit, offset } = query;
    
    // Audit the API access
    this.auditService.log({
      action: 'OSCAL_DOCUMENTS_API_ACCESS',
      actor: user.id,
      resource: 'oscal-documents',
      details: { type, limit, offset },
      success: true
    });
    
    return this.oscalService.getDocuments(type, limit, offset).pipe(
      tap(documents => {
        this.logger.debug('OSCAL documents retrieved', 'OscalController', {
          userId: user.id,
          count: documents.length,
          filters: { type, limit, offset }
        });
      }),
      catchError(err => {
        this.logger.error('Failed to retrieve OSCAL documents', 'OscalController', {
          userId: user.id,
          error: err.message
        });
        throw err;
      })
    );
  }

  @Get('documents/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('oscal:read')
  getDocumentById(@Param('id') id: string, @Req() req: RequestWithUser): Observable<OscalDocument | null> {
    const { user } = req;
    
    // Audit the API access
    this.auditService.log({
      action: 'OSCAL_DOCUMENT_API_ACCESS',
      actor: user.id,
      resource: 'oscal-document',
      resourceId: id,
      success: true
    });
    
    return this.oscalService.getDocumentById(id).pipe(
      tap(document => {
        this.logger.debug('OSCAL document retrieved', 'OscalController', {
          userId: user.id,
          documentId: id,
          documentType: document.documentType
        });
      }),
      catchError(err => {
        this.logger.error('Failed to retrieve OSCAL document', 'OscalController', {
          userId: user.id,
          documentId: id,
          error: err.message
        });
        throw err;
      })
    );
  }

  @Get('documents/:id/xml')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('oscal:read')
  getDocumentXml(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Headers('accept') accept: string
  ): void {
    const { user } = req;
    const wantsDownload = accept.includes('application/octet-stream');
    
    // Audit the API access
    this.auditService.log({
      action: 'OSCAL_DOCUMENT_XML_API_ACCESS',
      actor: user.id,
      resource: 'oscal-document',
      resourceId: id,
      details: { format: 'xml', download: wantsDownload },
      success: true
    });
    
    this.oscalService.getDocumentAsXml(id).subscribe({
      next: xmlContent => {
        this.logger.debug('OSCAL document XML generated', 'OscalController', {
          userId: user.id,
          documentId: id
        });
        
        if (wantsDownload) {
          res.setHeader('Content-Type', 'application/xml');
          res.setHeader('Content-Disposition', `attachment; filename=oscal-document-${id}.xml`);
        } else {
          res.setHeader('Content-Type', 'application/xml');
        }
        
        res.send(xmlContent);
      },
      error: err => {
        this.logger.error('Failed to generate XML for OSCAL document', 'OscalController', {
          userId: user.id,
          documentId: id,
          error: err.message
        });
        res.status(500).json({
          error: 'Failed to generate XML document',
          message: err.message
        });
      }
    });
  }

  @Get('documents/:id/json')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('oscal:read')
  getDocumentJson(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Headers('accept') accept: string
  ): void {
    const { user } = req;
    const wantsDownload = accept.includes('application/octet-stream');
    
    // Audit the API access
    this.auditService.log({
      action: 'OSCAL_DOCUMENT_JSON_API_ACCESS',
      actor: user.id,
      resource: 'oscal-document',
      resourceId: id,
      details: { format: 'json', download: wantsDownload },
      success: true
    });
    
    this.oscalService.getDocumentById(id).subscribe({
      next: document => {
        this.logger.debug('OSCAL document JSON retrieved', 'OscalController', {
          userId: user.id,
          documentId: id
        });
        
        if (wantsDownload) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename=oscal-document-${id}.json`);
          res.send(JSON.stringify(document, null, 2));
        } else {
          res.json(document);
        }
      },
      error: err => {
        this.logger.error('Failed to retrieve JSON for OSCAL document', 'OscalController', {
          userId: user.id,
          documentId: id,
          error: err.message
        });
        res.status(500).json({
          error: 'Failed to retrieve JSON document',
          message: err.message
        });
      }
    });
  }

  @Post('documents/:id/validate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('oscal:validate')
  validateDocument(@Param('id') id: string, @Req() req: RequestWithUser): Observable<ValidationResult> {
    const { user } = req;
    
    // Audit the validation request
    this.auditService.log({
      action: 'OSCAL_DOCUMENT_VALIDATION_REQUESTED',
      actor: user.id,
      resource: 'oscal-document',
      resourceId: id,
      success: true
    });
    
    return this.oscalService.validateDocument(id).pipe(
      tap(result => {
        this.logger.info('OSCAL document validation completed', 'OscalController', {
          userId: user.id,
          documentId: id,
          valid: result.valid,
          errorCount: result.errors?.length || 0
        });
        
        // Audit the validation result
        this.auditService.log({
          action: 'OSCAL_DOCUMENT_VALIDATION_COMPLETED',
          actor: user.id,
          resource: 'oscal-document',
          resourceId: id,
          details: {
            valid: result.valid,
            errorCount: result.errors?.length || 0
          },
          success: true
        });
      }),
      catchError(err => {
        this.logger.error('Failed to validate OSCAL document', 'OscalController', {
          userId: user.id,
          documentId: id,
          error: err.message
        });
        throw err;
      })
    );
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('oscal:read')
  getTemplates(@Req() req: RequestWithUser): Observable<OscalTemplate[]> {
    const { user } = req;
    
    // Audit the API access
    this.auditService.log({
      action: 'OSCAL_TEMPLATES_API_ACCESS',
      actor: user.id,
      resource: 'oscal-templates',
      success: true
    });
    
    return this.oscalService.getTemplates().pipe(
      tap(templates => {
        this.logger.debug('OSCAL templates retrieved', 'OscalController', {
          userId: user.id,
          count: templates.length
        });
      }),
      catchError(err => {
        this.logger.error('Failed to retrieve OSCAL templates', 'OscalController', {
          userId: user.id,
          error: err.message
        });
        throw err;
      })
    );
  }

  @Get('templates/:type')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('oscal:read')
  getTemplateByType(@Param('type') type: string, @Req() req: RequestWithUser): Observable<OscalTemplate | null> {
    const { user } = req;
    
    // Audit the API access
    this.auditService.log({
      action: 'OSCAL_TEMPLATE_API_ACCESS',
      actor: user.id,
      resource: 'oscal-template',
      resourceId: type,
      success: true
    });
    
    return this.oscalService.getTemplateByType(type).pipe(
      tap(template => {
        this.logger.debug('OSCAL template retrieved', 'OscalController', {
          userId: user.id,
          templateType: type,
          templateName: template?.name || 'Template not found',
          templateFound: !!template
        });
      }),
      catchError(err => {
        this.logger.error('Failed to retrieve OSCAL template', 'OscalController', {
          userId: user.id,
          templateType: type,
          error: err.message
        });
        throw err;
      })
    );
  }

  @Get('baselines')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('oscal:read')
  getBaselines(@Req() req: RequestWithUser): Observable<OscalBaseline[]> {
    const { user } = req;
    
    // Audit the API access
    this.auditService.log({
      action: 'OSCAL_BASELINES_API_ACCESS',
      actor: user.id,
      resource: 'oscal-baselines',
      success: true
    });
    
    return this.oscalService.getBaselines().pipe(
      tap(baselines => {
        this.logger.debug('OSCAL baselines retrieved', 'OscalController', {
          userId: user.id,
          count: baselines.length
        });
      }),
      catchError(err => {
        this.logger.error('Failed to retrieve OSCAL baselines', 'OscalController', {
          userId: user.id,
          error: err.message
        });
        throw err;
      })
    );
  }
}

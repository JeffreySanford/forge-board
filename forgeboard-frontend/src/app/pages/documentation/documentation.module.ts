import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { DocumentationComponent } from './documentation.component';
import { MarkdownRendererComponent } from './markdown-renderer/markdown-renderer.component';
import { TocGeneratorComponent } from './toc-generator/toc-generator.component';
import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  declarations: [
    DocumentationComponent,
    MarkdownRendererComponent,
    TocGeneratorComponent
  ],
  imports: [
    SharedModule,
    MarkdownModule.forChild(),
    SharedModule.forChild([
      { path: '', component: DocumentationComponent },
      { path: ':path', component: DocumentationComponent }
    ])
  ],
  exports: [
    DocumentationComponent
  ]
})
export class DocumentationModule { }

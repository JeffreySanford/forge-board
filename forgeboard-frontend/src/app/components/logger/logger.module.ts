import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LoggerTileComponent } from './logger-tile.component';
import { LogEntryComponent } from './log-entry.component';

@NgModule({
  declarations: [
    LoggerTileComponent,
    LogEntryComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule
  ],
  exports: [
    LoggerTileComponent,
    LogEntryComponent
  ],
  providers: [
    DatePipe,
    JsonPipe
  ]
})
export class LoggerModule { }

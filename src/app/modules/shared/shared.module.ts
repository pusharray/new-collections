import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import {
  ChipComponent,
  EmptyComponent,
  GroupControlsComponent,
  GroupsComponent,
  IconsContainerComponent,
  ImageComponent,
  ListItemComponent,
  MessageComponent,
  PanelHeaderComponent,
  RenameDialogComponent,
  RippleComponent,
  SearchComponent,
  SearchFormComponent,
  SpinnerComponent,
  TabListComponent,
  TabsSelectorComponent,
  TimelineComponent,
  TimelineElementComponent,
  TopSitesComponent,
} from './components/index';
import { StickyDirective, StopPropagationDirective } from './directives/index';
import { FaviconPipe, HostnamePipe } from './pipes/index';

const declarations = [
  ChipComponent,
  EmptyComponent,
  FaviconPipe,
  GroupControlsComponent,
  GroupsComponent,
  HostnamePipe,
  IconsContainerComponent,
  ImageComponent,
  ListItemComponent,
  MessageComponent,
  PanelHeaderComponent,
  RenameDialogComponent,
  RippleComponent,
  SearchComponent,
  SearchFormComponent,
  SpinnerComponent,
  StickyDirective,
  StopPropagationDirective,
  TabListComponent,
  TabsSelectorComponent,
  TimelineComponent,
  TimelineElementComponent,
  TopSitesComponent,
];

const materialModules = [
  DragDropModule,
  MatBadgeModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatExpansionModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatProgressSpinnerModule,
  MatRippleModule,
  MatTooltipModule,
];

@NgModule({
  declarations: [...declarations],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule.forChild(), ...materialModules],
  exports: [...materialModules, ...declarations],
})
export class SharedModule {}

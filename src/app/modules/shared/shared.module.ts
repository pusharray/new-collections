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
  TabListComponent,
  TabsSelectorComponent,
  TimelineComponent,
  TimelineElementComponent,
} from './components/index';
import { StopPropagationDirective } from './directives/index';
import { FaviconPipe, HostnamePipe, MatchPipe } from './pipes/index';

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
  MatchPipe,
  MessageComponent,
  PanelHeaderComponent,
  RenameDialogComponent,
  RippleComponent,
  SearchComponent,
  StopPropagationDirective,
  TabListComponent,
  TabsSelectorComponent,
  TimelineComponent,
  TimelineElementComponent,
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
  MatRippleModule,
  MatTooltipModule,
];

@NgModule({
  declarations: [...declarations],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule.forChild(), ...materialModules],
  exports: [...materialModules, ...declarations],
})
export class SharedModule {}

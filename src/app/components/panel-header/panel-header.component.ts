import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { StopPropagationDirective } from '../../directives';
import { TranslatePipe } from '../../pipes';
import { HostnameGroup } from '../../utils';
import { IconsContainerComponent } from '../icons-container/icons-container.component';

/**
 * Expansion panel header layout container.
 */
@Component({
  selector: 'nc-panel-header',
  templateUrl: './panel-header.component.html',
  styleUrl: './panel-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [IconsContainerComponent, MatIconModule, MatTooltipModule, NgClass, StopPropagationDirective, TranslatePipe],
})
export class PanelHeaderComponent {
  /**
   * Icons list.
   */
  readonly icons = input<HostnameGroup>();

  /**
   * Total number of items in the list
   */
  readonly total = input<number>();

  /**
   * Indicates pinned expansion panel
   */
  readonly pinned = input<boolean>(false);

  /**
   * Emits event when star button is clicked
   */
  readonly starred = output();

  /**
   * Disables edit buttons
   */
  readonly readOnly = input<boolean>(false);

  /**
   * Optional text to display
   */
  readonly titleText = input<string[]>();

  favClicked() {
    this.starred.emit();
  }
}

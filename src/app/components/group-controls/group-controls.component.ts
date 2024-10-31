import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StopPropagationDirective } from '../../directives';
import { CollectionsService, TabService } from '../../services/index';
import { queryCurrentWindow, restoreTabs, TabGroup, Tabs, translate } from '../../utils/index';

/**
 * @description
 *
 * Panel header controls container.
 */
@Component({
  selector: 'app-group-controls',
  templateUrl: './group-controls.component.html',
  styleUrl: './group-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, StopPropagationDirective],
})
export class GroupControlsComponent {
  readonly translate = translate;

  readonly group = input<TabGroup>();
  readonly readOnly = input<boolean>(false);

  readonly abs = Math.abs;

  constructor(
    private tabService: TabService,
    private collection: CollectionsService
  ) {}

  /**
   * Removes `group` from tab group list and storage.
   */
  removeTabs() {
    this.tabService.removeTabGroup(this.group());
  }

  /**
   * Opens all tabs from `group` object.
   */
  restoreTabs() {
    restoreTabs(this.group().tabs);
  }

  /**
   * Opens browser tab selector to add new tabs to current group.
   */
  async addTabs() {
    const tabs: Tabs = await queryCurrentWindow();

    if (this.readOnly()) {
      this.collection.selectTabs(this.group().tabs as Tabs);
    } else {
      this.tabService.addTabs(this.group(), tabs);
    }
  }
}

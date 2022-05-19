import { MatFabMenu } from '@angular-material-extensions/fab-menu';
import { Injectable } from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';
import { Observable, of } from 'rxjs';
import {
  Action,
  ActionIcon,
  Collections,
  exportTabs,
  getSavedTabs,
  importCollections,
  queryCurrentWindow,
  TabGroup,
} from 'src/app/utils';
import { TabService } from './tab.service';

/**
 * Tooltip position for menu items.
 */
export const tooltipPosition: TooltipPosition = 'left';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  /**
   * All available FAB menu items.
   */
  readonly menuItems$: Observable<MatFabMenu[]> = of([
    {
      id: Action.Save,
      icon: ActionIcon.Save,
      tooltip: 'Bookmark open tabs',
      tooltipPosition,
      color: 'accent',
    },
    {
      id: Action.Export,
      icon: ActionIcon.Export,
      tooltip: 'Save list as file',
      tooltipPosition,
    },
    {
      id: Action.Import,
      icon: ActionIcon.Import,
      tooltip: 'Import list from file',
      tooltipPosition,
    },
    {
      id: Action.Options,
      icon: ActionIcon.Options,
      tooltip: 'Open in new window',
      tooltipPosition,
    },
  ]);

  constructor(private tabsService: TabService) {}

  /**
   * Navigates to options page.
   */
  private openOptions() {
    chrome.runtime.openOptionsPage();
  }

  async handleMenuAction(menuAction: Action) {
    try {
      let collections: Collections;

      switch (menuAction) {
        case Action.Save:
          const tabs = await queryCurrentWindow();
          const tabGroup = await this.tabsService.createTabGroup(tabs);

          if (tabGroup?.tabs?.length > 0) {
            await this.tabsService.addTabGroup(tabGroup);
            this.openOptions();
          } else {
            this.tabsService.displayMessage('Current tab list is invalid');
          }
          break;
        case Action.Options:
          this.openOptions();
          break;
        case Action.Export:
          collections = await getSavedTabs();
          if (collections?.length > 0) {
            exportTabs(collections);
          } else {
            this.tabsService.displayMessage('Empty list cannot be exported');
          }
          break;
        case Action.Import:
          collections = await importCollections();
          const tabGroups = collections.map((collection) => new TabGroup(collection));
          await this.tabsService.addTabGroups(tabGroups);
          break;
      }
    } catch (e) {
      this.tabsService.displayMessage(e);
    }
  }
}

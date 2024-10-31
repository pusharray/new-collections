import { Injectable } from '@angular/core';
import { uniqBy } from 'lodash-es';
import { lastValueFrom } from 'rxjs';
import {
  Action,
  Collections,
  getCollections,
  ignoreUrlsRegExp,
  openOptions,
  queryCurrentWindow,
  saveFile,
  selectFile,
  TabGroup,
  Tabs,
  translate,
} from '../utils/index';
import { MessageService } from './message.service';
import { NavService } from './nav.service';
import { TabService } from './tab.service';

@Injectable({
  providedIn: 'root',
})
export class CollectionsService {
  constructor(
    private message: MessageService,
    private nav: NavService,
    private tabsService: TabService
  ) {}

  /**
   * Writes provided tab groups to JSON file.
   */
  private exportCollections(collections: Collections) {
    const blob = new Blob([JSON.stringify(collections, null, 2)], { type: 'text/json;charset=utf-8' });
    saveFile(blob, `new-collections-${new Date().toISOString()}.json`);
  }

  /**
   * Import tab groups JSON file from file system.
   */
  private async importCollections(): Promise<Collections> {
    return new Promise(async (resolve, reject) => {
      try {
        const files = await selectFile();

        const reader = new FileReader();
        reader.readAsText(files[0], 'utf-8');

        reader.onload = ({ target: { result } }) => {
          resolve(JSON.parse(result as string));
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  async selectTabs(tabs: Tabs) {
    tabs = uniqBy(
      tabs?.filter(({ url }) => !ignoreUrlsRegExp.test(url)),
      'url'
    );

    if (tabs?.length > 0) {
      const bottomSheetRef = this.tabsService.openTabsSelector(tabs);
      tabs = await lastValueFrom(bottomSheetRef.afterDismissed());
      if (tabs?.length > 0) {
        const tabGroup = await this.tabsService.createTabGroup(tabs);
        await this.tabsService.addTabGroup(tabGroup);
        this.nav.setParams(tabGroup.id);
      }
    } else {
      this.message.open(translate('invalidTabList'));
    }
  }

  async handleAction(action: Action) {
    try {
      let collections: Collections;

      switch (action) {
        case Action.Save:
          const tabs = await queryCurrentWindow();
          await this.selectTabs(tabs);
          break;
        case Action.Settings:
          openOptions();
          break;
        case Action.Export:
          collections = await getCollections();
          if (collections?.length > 0) {
            this.exportCollections(collections);
          } else {
            this.message.open(translate('emptyListError'));
          }
          break;
        case Action.Import:
          collections = await this.importCollections();
          const tabGroups = collections.map((collection) => new TabGroup(collection));
          await this.tabsService.addTabGroups(tabGroups);
          break;
      }
    } catch (e) {
      this.message.open(e);
    }
  }
}

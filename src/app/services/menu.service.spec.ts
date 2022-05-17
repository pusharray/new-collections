import { waitForAsync } from '@angular/core/testing';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { take } from 'rxjs/operators';
import { getBrowserTabMock, getTabGroupMock } from 'src/mocks';
import { Action, ActionIcon } from '../utils/models';
import { MenuService } from './menu.service';
import { TabService } from './tab.service';

jest.mock('src/app/utils', () => ({
  Action,
  ActionIcon,
  importTabs: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(0))),
  getSavedTabs: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(0))),
  queryCurrentWindow: jest.fn().mockImplementation(() => new Promise((resolve) => resolve([getBrowserTabMock()]))),
  usesDarkMode: jest.fn().mockImplementation(() => {}),
}));

describe('MenuService', () => {
  let spectator: SpectatorService<MenuService>;
  const createService = createServiceFactory({
    service: MenuService,
    providers: [
      {
        provide: TabService,
        useValue: {
          addTabGroup: () => new Promise((resolve) => resolve(0)),
          addTabGroups() {},
          createTabGroup: () => new Promise((resolve) => resolve(getTabGroupMock())),
          displayMessage() {},
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should return 4 actions', waitForAsync(() => {
    spectator.service.menuItems$.pipe(take(1)).subscribe((actions) => {
      expect(actions.length).toBe(4);
      expect(actions).toEqual([
        {
          id: 4,
          icon: 'bookmark_add',
          tooltip: 'Bookmark open tabs',
          tooltipPosition: 'left',
          color: 'accent',
        },
        {
          id: 1,
          icon: 'save_alt',
          tooltip: 'Save list as file',
          tooltipPosition: 'left',
        },
        {
          id: 2,
          icon: 'file_upload',
          tooltip: 'Import list from file',
          tooltipPosition: 'left',
        },
        {
          id: 3,
          icon: 'open_in_new',
          tooltip: 'Open in new window',
          tooltipPosition: 'left',
        },
      ]);
    });
  }));

  it('should handle actions', async () => {
    const service = spectator.service['tabsService'];

    const openOptionsPageSpy = jest.spyOn(chrome.runtime, 'openOptionsPage');
    const createTabGroupSpy = jest.spyOn(service, 'createTabGroup');
    const saveTabGroupsSpy = jest.spyOn(service, 'addTabGroups');
    const saveTabGroupSpy = jest.spyOn(service, 'addTabGroup');

    await spectator.service.handleMenuAction(Action.Save);
    expect(service.createTabGroup).toHaveBeenCalledTimes(1);
    expect(service.addTabGroup).toHaveBeenCalledTimes(1);
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);

    openOptionsPageSpy.mockClear();
    saveTabGroupSpy.mockClear();
    createTabGroupSpy.mockClear();

    await spectator.service.handleMenuAction(Action.Options);
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);

    openOptionsPageSpy.mockClear();

    await spectator.service.handleMenuAction(Action.Import);
    expect(service.addTabGroups).toHaveBeenCalledTimes(1);

    saveTabGroupsSpy.mockClear();
  });
});

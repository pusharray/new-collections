import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { firstValueFrom } from 'rxjs';
import { getBrowserTabsMock, getTabGroupsMock } from 'src/mocks';
import { v4 as uuidv4 } from 'uuid';
import { ActionIcon, ignoreUrlsRegExp, TabGroup } from '../utils/models';
import { getHostname, getHostnameGroup, getUrlHostname } from '../utils/tab';
import { NavService } from './nav.service';
import { TabService } from './tab.service';

jest.mock('src/app/utils', () => ({
  getSavedTabs: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(getTabGroupsMock()))),
  queryCurrentWindow: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(getBrowserTabsMock()))),
  queryTabs: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(getBrowserTabsMock))),
  removeTab: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(0))),
  saveTabGroups: jest.fn().mockImplementation(() => new Promise((resolve) => resolve(0))),
  usesDarkMode: jest.fn().mockImplementation(() => {}),
  ActionIcon,
  getHostname,
  getHostnameGroup,
  getUrlHostname,
  ignoreUrlsRegExp,
  TabGroup,
}));

describe('TabService', () => {
  let spectator: SpectatorService<TabService>;
  const createService = createServiceFactory({
    service: TabService,
    imports: [MatSnackBarModule, MatBottomSheetModule],
    providers: [
      {
        provide: NavService,
        useValue: {
          reset() {},
          setParams() {},
        },
      },
      {
        provide: MatDialog,
        useValue: {
          open() {},
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

  it('should initialize tabs', async () => {
    const tabGroups = await firstValueFrom(spectator.service.tabGroups$);

    expect(tabGroups.length).toBe(3);
    expect(tabGroups[0].tabs.length).toBe(5);
    expect(tabGroups[1].tabs.length).toBe(2);
    expect(tabGroups[2].tabs.length).toBe(4);
  });

  it('should generate tab group', async () => {
    const tabGroup = await spectator.service.createTabGroup(getBrowserTabsMock());

    expect(tabGroup.tabs.length).toBe(3);
  });

  it('should save tab group', async () => {
    const tabGroup = await spectator.service.createTabGroup(getBrowserTabsMock());
    await spectator.service.addTabGroup(tabGroup);

    const tabGroups = spectator.service['tabGroupsSource$'].value;

    expect(tabGroups.length).toBe(4);
    expect(tabGroups[0].tabs.length).toBe(3);

    const [tab1, tab2, tab3] = tabGroups[0].tabs;

    expect(tab1.id).toBe(48);
    expect(tab1.title).toBe('GitLab - The One DevOps Platform');
    expect(tab1.url).toBe('https://about.gitlab.com/');

    expect(tab2.id).toBe(49);
    expect(tab2.title).toBe('GitHub: Where the world builds software · GitHub');
    expect(tab2.url).toBe('https://github.com/');

    expect(tab3.id).toBe(50);
    expect(tab3.title).toBe('Fedora');
    expect(tab3.url).toBe('https://getfedora.org/');
  });

  it('should generate icon groups', async () => {
    const tabGroups = await firstValueFrom(spectator.service.tabGroups$);

    expect(tabGroups.length).toBe(3);

    const [g1, g2, g3] = tabGroups;

    const hostnameGroups = await firstValueFrom(spectator.service.tabsByHostname$);

    expect(hostnameGroups[g1.id].length).toBe(4);
    expect(hostnameGroups[g2.id].length).toBe(2);
    expect(hostnameGroups[g3.id].length).toBe(4);
  });

  it('should update tab and icon groups list when tab is removed', async () => {
    const groups = await firstValueFrom(spectator.service.tabGroups$);
    const [group1] = groups;
    const [ubuntuTab1, ubuntuTab2, mintTab] = group1.tabs;

    let hostnameGroups = await firstValueFrom(spectator.service.tabsByHostname$);
    expect(hostnameGroups[group1.id].length).toBe(4);

    await spectator.service.removeTab(ubuntuTab1);
    hostnameGroups = await firstValueFrom(spectator.service.tabsByHostname$);
    expect(hostnameGroups[group1.id].length).toBe(4);
    expect(group1.tabs.length).toBe(4);

    await spectator.service.removeTab(ubuntuTab2);
    spectator.service['tabGroupsSource$'].next(groups);
    hostnameGroups = await firstValueFrom(spectator.service.tabsByHostname$);
    expect(hostnameGroups[group1.id].length).toBe(3);
    expect(group1.tabs.length).toBe(3);

    await spectator.service.removeTab(mintTab);
    spectator.service['tabGroupsSource$'].next(groups);
    hostnameGroups = await firstValueFrom(spectator.service.tabsByHostname$);
    expect(hostnameGroups[group1.id].length).toBe(2);
    expect(group1.tabs.length).toBe(2);
  });

  it('should merge new tab groups with current ones', async () => {
    let groups = await firstValueFrom(spectator.service.tabGroups$);

    expect(groups.length).toBe(3);

    let [group1, group2, group3] = groups;

    expect(group1.tabs.length).toBe(5);
    expect(group2.tabs.length).toBe(2);
    expect(group3.tabs.length).toBe(4);

    let [tab1, tab2] = group2.tabs;
    expect(tab1.id).toBe(51);
    expect(tab1.title).toBe('GitHub: Where the world builds software · GitHub');
    expect(tab1.url).toBe('https://github.com/');
    expect(tab2.id).toBe(52);
    expect(tab2.title).toBe('DuckDuckGo — Privacy, simplified.');
    expect(tab2.url).toBe('https://duckduckgo.com/');

    // add same groups and groups array should be the same
    const collections = getTabGroupsMock();
    await spectator.service.addTabGroups(collections.map((collection) => new TabGroup(collection)));

    groups = await firstValueFrom(spectator.service.tabGroups$);

    expect(groups.length).toBe(3);

    [group1, group2, group3] = groups;

    expect(group1.tabs.length).toBe(5);
    expect(group2.tabs.length).toBe(2);
    expect(group3.tabs.length).toBe(4);

    // update groups with group ID that already exists
    await spectator.service.addTabGroups([
      new TabGroup({
        id: 'e200698d-d053-45f7-b917-e03b104ae127',
        tabs: [
          {
            favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
            id: 51,
            title: 'NEW TITLE 1',
            url: 'https://newlink.com/',
            pinned: false,
            active: false,
          },
          {
            favIconUrl: 'https://duckduckgo.com/favicon.ico',
            id: 52,
            title: 'NEW TITLE 2',
            url: 'https://anotherlink.com/',
            pinned: false,
            active: false,
          },
          {
            favIconUrl: 'https://duckduckgo.com/favicon.ico',
            id: 53,
            title: 'DuckDuckGo',
            url: 'https://duckduckgo.com/',
            pinned: false,
            active: false,
          },
        ],
        timestamp: 1650858875455,
      }),
    ]);

    groups = await firstValueFrom(spectator.service.tabGroups$);

    expect(groups.length).toBe(3);

    [group1, group2, group3] = groups;

    // tabs list should be updated
    expect(group2.tabs.length).toBe(3);

    // tabs titles and urls for existing tabs should be updated
    [tab1, tab2] = group2.tabs;
    expect(tab1.id).toBe(51);
    expect(tab1.title).toBe('NEW TITLE 1');
    expect(tab1.url).toBe('https://newlink.com/');
    expect(tab2.id).toBe(52);
    expect(tab2.title).toBe('NEW TITLE 2');
    expect(tab2.url).toBe('https://anotherlink.com/');

    // should add new group
    await spectator.service.addTabGroups([
      new TabGroup({
        id: uuidv4(),
        tabs: [
          {
            favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
            id: 123,
            title: 'GitHub: Where the world builds software · GitHub',
            url: 'https://github.com/',
            pinned: false,
            active: false,
          },
        ],
        timestamp: new Date().getTime(),
      }),
    ]);

    groups = await firstValueFrom(spectator.service.tabGroups$);

    expect(groups.length).toBe(4);

    [group1] = groups;

    expect(group1.tabs.length).toBe(1);
  });
});

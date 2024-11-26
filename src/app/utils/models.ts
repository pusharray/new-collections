import { ThemePalette } from '@angular/material/core';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { SafeUrl } from '@angular/platform-browser';
import { NavigationExtras, Params } from '@angular/router';
import { keyBy, remove } from 'lodash-es';
import { BehaviorSubject, Observable } from 'rxjs';
import { MessageComponent } from '../components';

/**
 * Local storage key for saving app settings
 */
export const settingsStorageKey = 'settings';

/**
 * Storage key to store tabs favicon URLs by hostname in separate object
 */
export const faviconStorageKey = 'favicon';

/**
 * Storage key to store tab ID maps to number of clicks
 */
export const recentKey = 'recent';

/**
 * URLs to ignore when saving tabs.
 */
export const ignoreUrlsRegExp = new RegExp('^(about:|chrome:|file:|wss:|ws:|chrome-extension:)', 'i');

/**
 * Regex to validate UUID
 * @copyright: https://github.com/uuidjs/uuid
 */
export const uuidRegExp = new RegExp(
  '^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$',
  'i'
);

export type SyncStorageArea = chrome.storage.SyncStorageArea;
export type QueryInfo = chrome.tabs.QueryInfo;
export type Tab = chrome.tabs.Tab;
export type Tabs = Tab[];
export type Device = chrome.sessions.Device;
export type MostVisitedURL = chrome.topSites.MostVisitedURL;
export type StorageArea = chrome.storage.StorageArea;
export type Session = chrome.sessions.Session;
export type Sessions = Session[];
export type Devices = Device[];
export type TopSite = MostVisitedURL;
export type TopSites = TopSite[];
export type MessageRef = MatSnackBarRef<MessageComponent>;
export type ImageSource = string | SafeUrl;

/**
 * Group tab groups by time label in hashmap.
 */
export type Timeline = TimelineElement[];

/**
 * setTimeout function return value type
 */
export type Timeout = ReturnType<typeof setTimeout>;

/**
 * Checks if group should be expanded by group ID
 */
export type GroupExpanded = { [groupId: string]: boolean };

/**
 * Checks if panel group is expanded by URL
 */
export type ExpandedGroupsByUrl = { [url: string]: GroupExpanded };

export type TabId = number;

export type RecentTabs = { [tabId: TabId]: number };

export interface RouterParams extends Params {
  groupId?: string;
  tabId?: TabId;
  query?: string;
}

export interface RouterExtras extends NavigationExtras {
  queryParams?: RouterParams;
}

/**
 * App settings config
 */
export interface Settings {
  enableDevices?: boolean;
  enableTopSites?: boolean;
  ignoreTopSites?: MostVisitedURL[];
  syncStorage?: boolean;
  panels?: ExpandedGroupsByUrl;
}

/**
 * BrowserTab structure used in storing in sync storage
 */
export type SyncTab = [id: number, url: string, title: string];
export type SyncTabs = SyncTab[];

/**
 * Map hostname to icon's URL
 */
export type FaviconHost = { [hostname: string]: string };

/**
 * Favicon data in sync storage
 */
export interface FaviconSync {
  [faviconStorageKey]?: FaviconHost;
}

/**
 * Settings data in sync storage
 */
export interface SettingsSync {
  [settingsStorageKey]?: Settings;
}

/**
 * Save recently used tabs in sync storage
 */
export interface RecentSync {
  [recentKey]?: {
    [tabId: TabId]: number;
  };
}

/**
 * Map group ID to array containing group timestamp and tabs
 */
export type GroupSync = {
  [groupId: string]: [timestamp: number, tabs: SyncTabs];
};

/**
 * Data used to store collections in sync storage
 */
export type SyncData = SettingsSync & FaviconSync & GroupSync & RecentSync;

/**
 * Storage change event
 */
export type StorageChanges = { [key: string]: chrome.storage.StorageChange };

/**
 * Tab type.
 */
export type BrowserTab = Pick<Tab, 'id' | 'url' | 'favIconUrl' | 'title'>;

export type BrowserTabs = BrowserTab[];

export interface Collection {
  id: string;
  timestamp: number;
  tabs: BrowserTabs;
}

export type Collections = Collection[];

/**
 * Group that contains tabs and is saved to local storage.
 */
export class TabGroup implements Collection {
  readonly id: string;

  #timestamp: number;

  /**
   * Time when group was created
   */
  get timestamp(): number {
    return this.#timestamp;
  }

  set timestamp(value: number) {
    this.#timestamp = value;
  }

  private readonly tabsSource$ = new BehaviorSubject<BrowserTabs>(null);

  readonly tabs$: Observable<BrowserTabs> = this.tabsSource$.asObservable();

  get tabs(): BrowserTabs {
    return this.tabsSource$.value;
  }

  constructor({ id, timestamp, tabs }: Collection) {
    this.id = id;
    this.#timestamp = timestamp;

    this.tabsSource$.next(tabs);
  }

  /**
   * Toggles timestamp positive to negative.
   * Negative timestamp value means tab group is pinned.
   */
  favToggle() {
    this.#timestamp *= -1;
  }

  /**
   * Merges current tabs list with provided one.
   *
   * @param tabs New tab list.
   * @param sync True if current tabs should be removed if not in new list.
   */
  mergeTabs(tabs: BrowserTabs, sync = false) {
    const currTabsById = keyBy(this.tabs, 'id');

    if (sync) {
      const newTabsById = keyBy(tabs, 'id');
      remove(this.tabs, ({ id }) => !(id in newTabsById));
    }

    tabs?.forEach((newTab, index) => {
      if (!(newTab.id in currTabsById)) {
        this.tabs.splice(index, 0, newTab);
      } else {
        const currTab = currTabsById[newTab.id];
        currTab.favIconUrl = newTab.favIconUrl;
        currTab.title = newTab.title;
        currTab.url = newTab.url;
      }
    });

    this.tabsSource$.next(this.tabs);
  }

  updateTab(tab: BrowserTab, updatedTab: BrowserTab): BrowserTab {
    const index = this.tabs.findIndex((t) => t === tab);

    if (index > -1) {
      const mergeTab: BrowserTab = {
        ...tab,
        ...updatedTab,
      };

      this.tabs.splice(index, 1, mergeTab);

      this.tabsSource$.next(this.tabs);

      return mergeTab;
    }
  }

  prepend(tabs: BrowserTabs) {
    this.tabs.unshift(...tabs);
    this.tabsSource$.next(this.tabs);
  }

  addTabAt(index: number, tab: BrowserTab) {
    this.tabs.splice(index, 0, tab);
    this.tabsSource$.next(this.tabs);
  }

  removeTabAt(index: number) {
    this.tabs.splice(index, 1);
    this.tabsSource$.next(this.tabs);
  }

  removeTabs(tabs: BrowserTabs) {
    remove(this.tabs, (tab) => tabs.includes(tab));
    this.tabsSource$.next(this.tabs);
  }
}

export type TabGroups = TabGroup[];

export type HostnameGroup = BrowserTabs[];

/**
 * Maps hostname groups to tab group ID.
 */
export interface TabsByHostname {
  [groupId: string]: HostnameGroup;
}

/**
 * Action icons.
 */
export enum ActionIcon {
  Delete = 'delete_forever',
  Edit = 'edit_note',
  Export = 'save_alt',
  Find = 'manage_search',
  Forget = 'delete_history',
  Import = 'file_upload',
  Remove = 'playlist_remove',
  Save = 'bookmark_add',
  Settings = 'settings',
  Undo = 'undo',
}

/**
 * Available actions within application.
 */
export enum Action {
  Delete,
  Edit,
  Export,
  Find,
  Forget,
  Import,
  Remove,
  Save,
  Settings,
}

export type Actions = Action[];

export interface TabAction {
  action: Action;
  icon: ActionIcon;
  label: string;
}

export type TabActions = TabAction[];

export const tabActions = new Map<Action, TabAction>([
  [
    Action.Edit,
    {
      action: Action.Edit,
      icon: ActionIcon.Edit,
      label: 'edit',
    },
  ],
  [
    Action.Delete,
    {
      action: Action.Delete,
      icon: ActionIcon.Remove,
      label: 'remove',
    },
  ],
  [
    Action.Find,
    {
      action: Action.Find,
      icon: ActionIcon.Find,
      label: 'find',
    },
  ],
  [
    Action.Forget,
    {
      action: Action.Forget,
      icon: ActionIcon.Forget,
      label: 'removeRecent',
    },
  ],
]);

/**
 * Collection Action
 */
export interface CollectionAction {
  action: Action;
  icon?: ActionIcon;
  tooltip?: string;
  color?: ThemePalette;
  label?: string;
}

export type CollectionActions = CollectionAction[];

/**
 * Common icon sizes.
 */
export type IconSize = 'small' | 'medium' | 'large';

/**
 * Timeline-like element.
 */
export interface TimelineElement {
  label: string;
  elements: TabGroups;
}

export const ESC_KEY_CODE = 'Escape';

export const KEY_UP = 'keyup';

export const KEY_DOWN = 'keydown';

export const RECENT_LIMIT = 5;

export type Target = '_blank' | '_self';

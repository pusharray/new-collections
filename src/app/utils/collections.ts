import isUndefined from 'lodash/isUndefined';
import keyBy from 'lodash/keyBy';
import { validate as uuidValidate } from 'uuid';
import {
  BrowserTabs,
  Collection,
  Collections,
  faviconStorageKey,
  Settings,
  StorageArea,
  SyncData,
  SyncTabs,
} from './models';
import { getSettings, getUrlHostname } from './utils';

/**
 * Returns storage in use.
 */
export async function getStorage(): Promise<StorageArea> {
  const settings: Settings = await getSettings();
  return isUndefined(settings?.syncStorage) || settings?.syncStorage ? chrome.storage.sync : chrome.storage.local;
}

/**
 * Saves collections to storage.
 */
export async function saveCollections(collections: Collections): Promise<void> {
  const storage = await getStorage();
  const syncData: SyncData = (await storage.get()) ?? {};
  const collectionsById: { [id: string]: Collection } = keyBy(collections, 'id');

  const removeKeys = [faviconStorageKey];
  for (let groupId in syncData) {
    if (uuidValidate(groupId) && !(groupId in collectionsById)) {
      delete syncData[groupId];
      removeKeys.push(groupId);
    }
  }

  await storage.remove(removeKeys);

  delete syncData[faviconStorageKey];

  if (collections?.length > 0) {
    collections.forEach(({ tabs, timestamp, id }) => (syncData[id] = [timestamp, tabsToSync(tabs)]));

    const favicon: { [host in string]: string } = {};
    collections.forEach(({ tabs }) =>
      tabs.filter(({ favIconUrl }) => favIconUrl).forEach((tab) => (favicon[getUrlHostname(tab.url)] = tab.favIconUrl))
    );

    return storage.set({
      [faviconStorageKey]: favicon,
      ...syncData,
    });
  }
}

export async function getFaviconStore(): Promise<{ [hostname in string]: string }> {
  const storage = await getStorage();
  const favicon = await storage.get(faviconStorageKey);
  return favicon[faviconStorageKey] ?? {};
}

/**
 * Returns saved collections from storage.
 */
export const getCollections = async (): Promise<Collections> => {
  const storage = await getStorage();
  const syncData: SyncData = await storage.get();

  if (syncData) {
    const favicon = await getFaviconStore();

    const collections: Collections = Object.keys(syncData)
      .filter((groupId) => uuidValidate(groupId))
      .map((groupId) => ({
        id: groupId,
        timestamp: syncData[groupId][0],
        tabs: syncToTabs(syncData[groupId][1]).map((tab) => {
          tab.favIconUrl = favicon[getUrlHostname(tab.url)];
          return tab;
        }),
      }));

    return collections.length > 0 ? collections : null;
  }
};

/**
 * Converts BrowserTabs to tabs structure used in storage.
 */
export function tabsToSync(tabs: BrowserTabs): SyncTabs {
  return tabs.map(({ id, url, title, pinned }) => [id, url, title, pinned]);
}

/**
 * Converts storage tabs to BrowserTabs.
 */
export function syncToTabs(sync: SyncTabs): BrowserTabs {
  return sync.map(([id, url, title, pinned]) => ({
    id,
    pinned,
    title,
    url,
  }));
}

/**
 * Copies source storage collection to target storage.
 */
export async function copyStorage(source: StorageArea, target: StorageArea) {
  const sourceData: SyncData = await source.get();
  const newData: SyncData = {
    [faviconStorageKey]: sourceData[faviconStorageKey],
  };

  const sourceKeys = Object.keys(sourceData).filter((groupId) => uuidValidate(groupId));
  sourceKeys.forEach((key) => (newData[key] = sourceData[key]));
  await source.remove([faviconStorageKey, ...sourceKeys.map((key) => key)]);
  await target.set(newData);
}

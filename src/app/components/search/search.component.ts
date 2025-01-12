import { AsyncPipe, NgPlural, NgPluralCase } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnInit,
  output,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import Fuse, { IFuseOptions } from 'fuse.js';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  lastValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  takeWhile,
} from 'rxjs';

import { isNil } from 'lodash';
import { SubSinkDirective } from '../../directives';
import { TranslatePipe } from '../../pipes';
import { KeyService, NavService, TabService } from '../../services';
import {
  Action,
  Actions,
  BrowserTab,
  BrowserTabs,
  listItemAnimation,
  RECENT_DISPLAY,
  removeRecent,
  Target,
} from '../../utils';
import { EmptyComponent } from '../empty/empty.component';
import { ListItemComponent } from '../list-item/list-item.component';
import { TabListComponent } from '../tab-list/tab-list.component';
import { TimelineLabelComponent } from '../timeline-label/timeline-label.component';

const fuseOptions: IFuseOptions<BrowserTab> = {
  keys: ['title', 'url'],
  threshold: 0.33,
  ignoreLocation: true,
  useExtendedSearch: true,
};

const LATEST_LIMIT = 10;

/**
 * @description
 *
 * Search form component
 */
@Component({
  selector: 'nc-search',
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listItemAnimation],
  imports: [
    AsyncPipe,
    EmptyComponent,
    ListItemComponent,
    MatCardModule,
    MatIconModule,
    NgPlural,
    NgPluralCase,
    TabListComponent,
    TimelineLabelComponent,
    TranslatePipe,
  ],
})
export class SearchComponent extends SubSinkDirective implements OnInit {
  readonly Action = Action;

  readonly source = input.required<BrowserTabs>();
  readonly #source$ = toObservable(this.source);

  readonly devices = input<BrowserTabs>();
  readonly #devices$ = toObservable(this.devices);

  /**
   * Scroll list item into view
   */
  readonly findItem = output<BrowserTab>();

  /**
   * Tabs data from search results
   */
  sourceTabs$: Observable<BrowserTabs>;

  /**
   * Tabs from synced devices
   */
  deviceTabs$: Observable<BrowserTabs>;

  get target(): Target {
    return this.navService.isPopup ? '_blank' : '_self';
  }

  private listItems = viewChildren(ListItemComponent);

  readonly #searchResults$ = new BehaviorSubject<BrowserTabs>([]);
  readonly searchQuery$: Observable<string> = this.navService.paramsSearch$.pipe(shareReplay(1));

  /**
   * Recently used tabs
   */
  readonly recentTabs$ = new BehaviorSubject<BrowserTabs>(null);

  readonly defaultActions: Actions = [Action.Find, Action.Edit, Action.Delete];
  readonly recentActions: Actions = [Action.Forget, ...this.defaultActions];

  constructor(
    private readonly navService: NavService,
    private readonly tabService: TabService,
    private readonly keyService: KeyService<ListItemComponent>
  ) {
    super();

    effect(async () => {
      const listItems = this.listItems();
      this.keyService.clear();
      this.keyService.setItems(listItems);

      const searchQuery = await firstValueFrom(this.searchQuery$);

      if (searchQuery?.length > 0) {
        this.keyService.setActive(0);
      }
    });
  }

  ngOnInit() {
    const fuse = new Fuse<BrowserTab>([], fuseOptions);

    const fuse$: Observable<Fuse<BrowserTab>> = this.#source$.pipe(
      filter((source) => source?.length > 0),
      map((source) => {
        fuse.setCollection(source);
        return fuse;
      })
    );

    const resultChanges = this.searchQuery$
      .pipe(
        filter((searchQuery) => searchQuery?.length > 0),
        distinctUntilChanged(),
        switchMap((searchValue) =>
          fuse$.pipe(
            take(1),
            map((fuse) => fuse.search(searchValue).map(({ item }) => item))
          )
        )
      )
      .subscribe((tabs) => this.#searchResults$.next(tabs));

    this.subscribe(resultChanges);

    this.sourceTabs$ = combineLatest([this.searchQuery$, this.#searchResults$, this.#source$]).pipe(
      map(([searchQuery, searchResults, source]) => {
        if (searchQuery?.length) {
          return searchResults;
        }

        return source.sort((a, b) => b.id - a.id).slice(0, LATEST_LIMIT);
      }),
      shareReplay(1)
    );

    const recentTabs = combineLatest([this.tabService.recentTabs$, this.#source$])
      .pipe(
        takeWhile(([recentTabs, tabs]) => isNil(recentTabs) || !tabs?.length, true),
        filter(([recentTabs, tabs]) => !isNil(recentTabs) && tabs.length > 0),
        map(([recentTabs, tabs]) => {
          const filterTabs = tabs?.filter((tab) => recentTabs?.[tab.id]);
          const sortTabs = this.tabService.sortByRecent(filterTabs, recentTabs);
          return sortTabs.slice(0, RECENT_DISPLAY);
        })
      )
      .subscribe((tabs) => this.recentTabs$.next(tabs));

    this.subscribe(recentTabs);

    const fuseDevices$: Observable<Fuse<BrowserTab>> = this.#devices$.pipe(
      filter((devices) => devices?.length > 0),
      map((devices) => new Fuse(devices, fuseOptions)),
      take(1)
    );

    this.deviceTabs$ = this.searchQuery$.pipe(
      switchMap((search) => {
        if (search) {
          return fuseDevices$.pipe(map((fuse) => fuse.search(search)?.map(({ item }) => item)));
        }

        return of([]);
      }),
      shareReplay(1)
    );
  }

  /**
   * Handles tab update
   */
  async itemModified(tab: BrowserTab) {
    const updatedTab = await this.tabService.updateTab(tab);

    if (updatedTab) {
      const index = this.getSearchIndex(tab);

      if (index > -1) {
        const results = this.#searchResults$.value;
        results.splice(index, 1, updatedTab);
        this.#searchResults$.next(results);
      }
    }
  }

  /**
   * Handles tab deletion
   */
  async itemDeleted(tab: BrowserTab) {
    const messageRef = await this.tabService.removeTab(tab);

    await this.recentRemoved(tab);

    const index = this.getSearchIndex(tab);

    if (index > -1) {
      const results = this.#searchResults$.value;
      results.splice(index, 1);
      this.#searchResults$.next(results);

      const { dismissedByAction } = await lastValueFrom(messageRef.afterDismissed());

      if (dismissedByAction) {
        results.splice(index, 0, tab);
        this.#searchResults$.next(results);
      }
    }
  }

  private getSearchIndex(tab: BrowserTab): number {
    return this.#searchResults$.value?.findIndex((t) => t === tab);
  }

  async recentRemoved(tab: BrowserTab) {
    if (tab) {
      await removeRecent(tab?.id);

      const index = this.recentTabs$.value?.findIndex((t) => t === tab);

      if (index > -1) {
        const recentTabs = this.recentTabs$.value;
        recentTabs.splice(index, 1);
        this.recentTabs$.next(recentTabs);

        return index;
      }
    }
  }
}

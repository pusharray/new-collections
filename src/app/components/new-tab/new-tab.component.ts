import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { flatMap, isNil } from 'lodash-es';
import { Observable, combineLatest, map, shareReplay } from 'rxjs';

import { HomeService, NavService, TabService } from '../../services';
import { BrowserTabs, TopSites } from '../../utils';
import { NewTabContentComponent } from '../new-tab-content/new-tab-content.component';
import { SearchFormComponent } from '../search-form/search-form.component';
import { TopSitesComponent } from '../top-sites/top-sites.component';

/**
 * @description
 *
 * New Tab root component.
 */
@Component({
  selector: 'nc-new-tab',
  templateUrl: './new-tab.component.html',
  styleUrls: ['./new-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [AsyncPipe, SearchFormComponent, TopSitesComponent, NewTabContentComponent],
})
export class NewTabComponent implements OnInit {
  urlChanges$: Observable<string>;
  topSites$: Observable<TopSites>;
  hasData$: Observable<boolean>;
  searchSource$: Observable<BrowserTabs>;
  devices$: Observable<BrowserTabs>;

  /**
   * Check if search is active
   */
  readonly isSearchActive$ = this.navService.pathChanges$.pipe(
    map(() => this.navService.isActive('search')),
    shareReplay(1)
  );

  /**
   * Hide top sites component when search is active
   */
  hideTopSites$: Observable<boolean>;

  constructor(
    private readonly homeService: HomeService,
    private readonly navService: NavService,
    private readonly tabService: TabService
  ) {}

  ngOnInit() {
    this.urlChanges$ = this.navService.pathChanges$;
    this.topSites$ = this.homeService.topSites$;
    this.hasData$ = this.homeService.hasAnyData$;
    this.searchSource$ = this.tabService.tabs$;

    this.devices$ = this.homeService.devices$.pipe(
      map((devices) => flatMap(devices?.map((device) => this.homeService.getTabsFromSessions(device.sessions)))),
      shareReplay(1)
    );

    this.hideTopSites$ = combineLatest([this.topSites$, this.isSearchActive$]).pipe(
      map(([topSites, isSearchActive]) => isNil(topSites) || topSites?.length === 0 || isSearchActive),
      shareReplay(1)
    );
  }
}

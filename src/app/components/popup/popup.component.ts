import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';

import { NavService, TabService } from '../../services';
import { BrowserTab, BrowserTabs } from '../../utils';
import { PopupContentComponent } from '../popup-content/popup-content.component';
import { SearchFormComponent } from '../search-form/search-form.component';

/**
 * @description
 *
 * Root component for extension popup that renders stored tab groups data.
 */
@Component({
  selector: 'nc-popup',
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [AsyncPipe, SearchFormComponent, PopupContentComponent],
})
export class PopupComponent {
  readonly urlChanges$ = this.navService.pathChanges$.pipe(shareReplay(1));
  readonly hasData$: Observable<boolean> = this.tabService.groupsTimeline$.pipe(
    map((timeline) => timeline?.length > 0),
    shareReplay(1)
  );

  readonly searchSource$: Observable<BrowserTabs> = this.tabService.tabs$;

  constructor(
    private readonly navService: NavService,
    private readonly tabService: TabService
  ) {}

  /**
   * Scroll specified tab into view
   */
  async findItem(tab: BrowserTab) {
    const group = await this.tabService.getGroupByTab(tab);

    if (group) {
      await this.navService.navigate(['/popup'], {
        queryParams: {
          groupId: group.id,
          tabId: tab.id,
          query: undefined,
        },
      });
    }
  }
}

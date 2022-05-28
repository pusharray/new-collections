import { ChangeDetectionStrategy, Component } from '@angular/core';
import { isNil } from 'lodash';
import { map, Observable, shareReplay } from 'rxjs';
import { TabService } from 'src/app/services';
import { TabGroups, TimelineElement } from 'src/app/utils';

/**
 * @description
 *
 * Displays tab groups separated by time.
 */
@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {
  readonly timeline$ = this.tabService.groupsTimeline$;

  readonly timelineLabels$: Observable<string[]> = this.timeline$.pipe(
    map((timeline) => (!isNil(timeline) ? Object.keys(timeline) : null)),
    shareReplay(1)
  );

  constructor(private tabService: TabService) {}

  /**`
   * Removes all items in timeline section
   */
  async removeGroups(groups: TimelineElement[]) {
    await this.tabService.removeTabGroups(groups as TabGroups);
  }
}

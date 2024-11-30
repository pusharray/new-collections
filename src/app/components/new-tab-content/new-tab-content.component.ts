import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { TranslatePipe } from '../../pipes';
import { HomeService, TabService } from '../../services';
import { Action, ActionIcon, Actions, CollectionActions, TabGroups, Timeline, translate } from '../../utils';
import { EmptyComponent } from '../empty/empty.component';
import { GroupsComponent } from '../groups/groups.component';
import { TimelineElementComponent } from '../timeline-element/timeline-element.component';

/**
 * @description
 *
 * New Tab content component.
 */
@Component({
  selector: 'nc-new-tab-content',
  templateUrl: './new-tab-content.component.html',
  styleUrls: ['./new-tab-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, EmptyComponent, GroupsComponent, TimelineElementComponent, TranslatePipe],
})
export class NewTabContentComponent {
  readonly tabActions: Actions = [Action.Edit, Action.Delete];

  readonly noDataActions: CollectionActions = [
    {
      action: Action.Import,
      icon: ActionIcon.Import,
      label: translate('importCollections'),
      color: 'primary',
    },
  ];

  readonly devicesTimeline$: Observable<Timeline> = this.homeService.devicesTimeline$;
  readonly hasAnyData$: Observable<boolean> = this.homeService.hasAnyData$;
  readonly timeline$: Observable<Timeline> = this.homeService.timeline$;

  constructor(
    private readonly homeService: HomeService,
    private readonly tabService: TabService
  ) {}

  /**`
   * Removes all items in timeline section
   */
  async removeGroups(groups: TabGroups) {
    await this.tabService.removeTabGroups(groups);
  }
}

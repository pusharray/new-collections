import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';

import { TranslatePipe } from '../../pipes';
import { TabService } from '../../services';
import { Action, ActionIcon, Actions, CollectionActions, TabGroups, Timeline, translate } from '../../utils';
import { EmptyComponent } from '../empty/empty.component';
import { GroupsComponent } from '../groups/groups.component';
import { TimelineElementComponent } from '../timeline-element/timeline-element.component';

/**
 * @description
 *
 * Content component for extension popup that renders stored tab groups data.
 */
@Component({
  selector: 'nc-popup-content',
  templateUrl: './popup-content.component.html',
  styleUrl: './popup-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, EmptyComponent, GroupsComponent, TranslatePipe, TimelineElementComponent],
})
export class PopupContentComponent {
  readonly tabActions: Actions = [Action.Edit, Action.Delete];

  readonly noDataActions: CollectionActions = [
    {
      action: Action.Save,
      icon: ActionIcon.Save,
      label: translate('addCollection'),
      color: 'primary',
    },
  ];

  /**
   * Tab groups grouped by time
   */
  readonly groupsTimeline$: Observable<Timeline> = this.tabService.groupsTimeline$;

  constructor(private tabService: TabService) {}

  /**`
   * Removes all items in timeline section
   */
  async removeGroups(groups: TabGroups) {
    await this.tabService.removeTabGroups(groups);
  }
}

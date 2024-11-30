import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Observable, map, shareReplay } from 'rxjs';

import { IsReadOnlyGroupPipe } from '../../pipes';
import { NavService, SettingsService, TabService } from '../../services';
import {
  Actions,
  BrowserTab,
  BrowserTabs,
  GroupExpanded,
  TabGroup,
  TabGroups,
  TabsByHostname,
  Target,
  listItemAnimation,
} from '../../utils';
import { GroupControlsComponent } from '../group-controls/group-controls.component';
import { ListItemComponent } from '../list-item/list-item.component';
import { PanelHeaderComponent } from '../panel-header/panel-header.component';
import { RippleComponent } from '../ripple/ripple.component';

/**
 * @description
 *
 * Displays list of tab groups.
 */
@Component({
  selector: 'nc-groups',
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listItemAnimation],
  imports: [
    AsyncPipe,
    CdkDrag,
    CdkDropList,
    GroupControlsComponent,
    IsReadOnlyGroupPipe,
    ListItemComponent,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    PanelHeaderComponent,
    RippleComponent,
  ],
})
export class GroupsComponent {
  readonly tabActions = input<Actions>();

  /**
   * List of tab groups to render.
   */
  readonly groups = input.required<TabGroups>();
  readonly groups$: Observable<TabGroups>;

  /**
   * Disable list items drag and drop
   */
  readonly dragDisabled = input<boolean>(true);

  /**
   * Expand and collapse panels based on query params groupId
   */
  readonly activeGroupId$: Observable<string>;

  /**
   * Active tab ID from query params
   */
  readonly activeTabId$: Observable<number>;

  /**
   * Groups tabs by their hostname to create header icons
   */
  readonly tabsByHostname$: Observable<TabsByHostname>;

  /**
   * Maps group ID to list of group's tab titles
   */
  readonly titlesMap$: Observable<Map<string, string[]>>;

  /**
   * Hashmap of expanded panel states by group ID
   */
  readonly panelStates$: Observable<GroupExpanded>;

  readonly isNaN = isNaN;

  get target(): Target {
    return this.navService.isPopup ? '_blank' : '_self';
  }

  constructor(
    private readonly navService: NavService,
    private readonly tabService: TabService,
    private readonly settings: SettingsService
  ) {
    this.groups$ = toObservable(this.groups);

    this.tabsByHostname$ = this.groups$.pipe(
      map((tabGroups) => (tabGroups?.length > 0 ? this.tabService.createHostnameGroups(tabGroups) : null)),
      shareReplay(1)
    );

    this.titlesMap$ = this.groups$.pipe(
      map((tabGroups) => {
        const map = new Map<string, string[]>();

        tabGroups.forEach((group) =>
          map.set(
            group.id,
            group.tabs.map((tab) => tab.title)
          )
        );

        return map;
      }),
      shareReplay(1)
    );

    this.panelStates$ = this.settings.panelStates$.pipe(map((states) => states ?? {}));
    this.activeGroupId$ = this.navService.paramsGroupId$;
    this.activeTabId$ = this.navService.paramsTabId$;
  }

  favGroup(group: TabGroup) {
    this.tabService.favGroupToggle(group);
  }

  /**
   * Saves open panel state to local storage
   */
  opened(groupId: string) {
    this.settings.savePanelState(groupId, true);
  }

  /**
   * Removes open panel state from storage
   */
  closed(groupId: string) {
    this.settings.savePanelState(groupId, false);
  }

  /**
   * Handles tab group drag and drop event
   */
  drop(event: CdkDragDrop<BrowserTabs>, tabs: BrowserTabs) {
    moveItemInArray(tabs, event.previousIndex, event.currentIndex);
    this.tabService.save();
  }

  async editTab(tab: BrowserTab) {
    await this.tabService.updateTab(tab);
  }

  async deleteTab(tab: BrowserTab) {
    await this.tabService.removeTab(tab);
  }
}

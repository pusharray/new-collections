import { MatFabMenu } from '@angular-material-extensions/fab-menu';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { getSavedTabs, importTabs, TabGroup } from '@lib';
import { map, Observable } from 'rxjs';
import { Action, MenuService, TabService } from 'src/app/services';

/**
 * @description
 *
 * Extension Options page.
 */
@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionsComponent {
  /**
   * Data source for stored tab groups.
   */
  readonly groups$: Observable<TabGroup[]> = this.tabsService.tabGroups$;

  /**
   * Main menu items.
   */
  readonly menuItems$: Observable<MatFabMenu[]> = this.menuService.menuItems$.pipe(
    map((menuItems) =>
      menuItems.filter((item) => ![Action.Options, Action.Save].includes(item.id as Action))
    )
  );

  constructor(private tabsService: TabService, private menuService: MenuService) {}
}

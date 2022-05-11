import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { lastValueFrom } from 'rxjs';
import { TabService } from 'src/app/services';
import { BrowserTab } from 'src/app/utils';
import { RenameDialogComponent } from '../rename-dialog/rename-dialog.component';

/**
 * @description
 *
 * Tabs list component
 */
@Component({
  selector: 'app-tab-list',
  templateUrl: './tab-list.component.html',
  styleUrls: ['./tab-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TabListComponent {
  /**
   * Tabs list to display
   */
  @Input() tabs: BrowserTab[];

  /**
   * Emits event when tab is removed.
   */
  @Output() readonly tabRemoved = new EventEmitter<BrowserTab>();

  constructor(private tabService: TabService, private dialog: MatDialog, private cdr: ChangeDetectorRef) {}

  /**
   * Opens dialog to edit specified tab.
   */
  async editTab(tab: BrowserTab) {
    const dialogRef = this.dialog.open(RenameDialogComponent, { data: tab, disableClose: true });
    const update: Pick<BrowserTab, 'title' | 'url'> = await lastValueFrom(dialogRef.afterClosed());

    if (update && (tab.title !== update.title || tab.url !== update.url)) {
      tab.title = update.title;
      tab.url = update.url;

      this.tabService.saveTabs();
      this.cdr.markForCheck();
    }
  }

  /**
   * Removes specified tab from tab list.
   */
  async removeTab(tab: BrowserTab) {
    const result = await this.tabService.removeTab(tab);

    if (result) {
      this.tabRemoved.emit(tab);
    }
  }
}

import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { MessageService, SettingsService } from 'src/app/services';
import { ActionIcon, TopSite, TopSites, translate } from 'src/app/utils';

/**
 * @description
 *
 * Top Sites expansion panel
 */
@Component({
  selector: 'app-top-sites',
  templateUrl: './top-sites.component.html',
  styleUrls: ['./top-sites.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TopSitesComponent {
  @Input() topSites: TopSites;
  
  readonly translate = translate();

  constructor(private message: MessageService, private settings: SettingsService) {}

  /**
   * Removes site from the list for top sites by ignoring it from the settings config
   */
  async removeSite(site: TopSite) {
    await this.settings.ignoreSite({
      title: site.title,
      url: site.url,
    });

    const ref = this.message.open(this.translate('siteMovedToIgnoreList'), ActionIcon.Settings);
    const { dismissedByAction } = await lastValueFrom(ref.afterDismissed());

    if (dismissedByAction) {
      chrome.runtime.openOptionsPage();
    }
  }
}

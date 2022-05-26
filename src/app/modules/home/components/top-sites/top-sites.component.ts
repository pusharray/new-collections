import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { SettingsService } from 'src/app/services';
import { TopSite, TopSites, trackBySite } from 'src/app/utils';
import { HomeService } from '../../services';

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
  readonly topSites$: Observable<TopSites> = this.homeService.topSites$.pipe(shareReplay(1));

  readonly trackBySite = trackBySite;

  constructor(private homeService: HomeService, private settings: SettingsService) {}

  /**
   * Removes site from the list for top sites by ignoring it from the settings config
   */
  removeSite(site: TopSite) {
    this.settings.ignoreSite({
      title: site.title,
      url: site.url,
    });
  }
}

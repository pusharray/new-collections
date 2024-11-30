import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { isUndefined } from 'lodash-es';
import { BehaviorSubject, Observable, map, shareReplay, startWith, take } from 'rxjs';

import { TranslatePipe } from '../../pipes';
import { CollectionsService, SettingsService } from '../../services';
import { Action, ActionIcon, CollectionActions, MostVisitedURL, translate } from '../../utils';

/**
 * Options form.
 */
interface OptionsForm {
  /**
   * Show/hide synced devices on new tab page.
   */
  enableDevices: FormControl<boolean>;

  /**
   * Show/hide top site on new tab page.
   */
  enableTopSites: FormControl<boolean>;

  /**
   * List of site to hide from top sites list.
   */
  ignoreTopSites: FormArray<FormControl<MostVisitedURL>>;

  /**
   * Use synced storage Chrome feature.
   */
  syncStorage: FormControl<boolean>;
}

/**
 * @description
 *
 * Extension Options page.
 */
@Component({
  selector: 'nc-options',
  templateUrl: './options.component.html',
  styleUrl: './options.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    AsyncPipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
})
export class OptionsComponent implements OnInit {
  readonly collectionActions: CollectionActions = [
    {
      action: Action.Export,
      color: 'primary',
      icon: ActionIcon.Export,
      label: translate('export'),
      tooltip: translate('exportCollections'),
    },
    {
      action: Action.Import,
      icon: ActionIcon.Import,
      label: translate('import'),
      tooltip: translate('importCollections'),
    },
  ];

  readonly #devicesControl = new FormControl<boolean>(true);
  readonly sitesControl = new FormControl<boolean>(true);
  readonly syncStorage = new FormControl<boolean>(true);
  readonly ignoreSitesControl = new FormArray([]);

  /**
   * Sync storage used
   */
  private readonly storageUsageSource$ = new BehaviorSubject<number>(0);

  /**
   * Chrome sync storage has limited quota (~100KB), this will show how much storage is currently inuse.
   */
  readonly storageUsage$: Observable<number> = this.storageUsageSource$.pipe(
    startWith(0),
    map((usage) => (usage / chrome.storage.sync.QUOTA_BYTES) * 100),
    shareReplay(1)
  );

  readonly formGroup = new FormGroup<OptionsForm>({
    enableDevices: this.#devicesControl,
    enableTopSites: this.sitesControl,
    ignoreTopSites: this.ignoreSitesControl,
    syncStorage: this.syncStorage,
  });

  constructor(
    private collectionsService: CollectionsService,
    private settings: SettingsService
  ) {}

  async ngOnInit() {
    this.storageUsageSource$.next(await this.settings.getUsageBytes());

    this.settings.settings$.pipe(take(1)).subscribe((settings) => {
      if (settings) {
        if (isUndefined(settings.enableTopSites)) {
          settings.enableTopSites = true;
        }

        this.sitesControl.setValue(settings.enableTopSites);

        if (isUndefined(settings.syncStorage)) {
          settings.syncStorage = true;
        }

        this.syncStorage.setValue(settings.syncStorage);

        if (isUndefined(settings.enableDevices)) {
          settings.enableDevices = true;
        }

        this.#devicesControl.setValue(settings.enableDevices);

        if (settings.ignoreTopSites?.length > 0) {
          settings.ignoreTopSites.forEach((site) => this.ignoreSitesControl.push(new FormControl(site)));
        }
      }

      this.formGroup.valueChanges.subscribe(async (settings) => {
        await this.settings.update(settings);

        const storageBytes = await this.settings.getUsageBytes();
        this.storageUsageSource$.next(storageBytes);
      });
    });
  }

  handleAction(action: Action) {
    this.collectionsService.handleAction(action);
  }
}

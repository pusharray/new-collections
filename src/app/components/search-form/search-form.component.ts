import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  ElementRef,
  HostBinding,
  input,
  OnInit,
  output,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import Fuse, { IFuseOptions } from 'fuse.js';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
} from 'rxjs';

import { MatListModule } from '@angular/material/list';
import { SubSinkDirective } from '../../directives';
import { CollectionsService, NavService, TabService } from '../../services';
import { Action, BrowserTab, BrowserTabs } from '../../utils';

/**
 * Search input form.
 */
interface SearchForm {
  search: FormControl<string>;
}

const fuseOptions: IFuseOptions<BrowserTab> = {
  keys: ['title', 'url'],
  threshold: 0.33,
  ignoreLocation: true,
  useExtendedSearch: true,
};

const LATEST_LIMIT = 10;

@Component({
  selector: 'nc-search-form',
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    AsyncPipe,
    CdkListbox,
    CdkOption,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatTooltipModule,
    ReactiveFormsModule,
  ],
})
export class SearchFormComponent extends SubSinkDirective implements OnInit {
  readonly Action = Action;

  readonly activated = output();
  readonly canceled = output();
  readonly blur = output();

  readonly source = input.required<BrowserTabs>();
  readonly #source$ = toObservable(this.source);

  readonly devices = input<BrowserTabs>();
  readonly #devices$ = toObservable(this.devices);

  /**
   * Tabs data from search results
   */
  sourceTabs$: Observable<BrowserTabs>;

  /**
   * Tabs from synced devices
   */
  deviceTabs$: Observable<BrowserTabs>;

  @HostBinding('class.disabled')
  private _disabled = false;

  readonly disabled = input<boolean>(false);

  private readonly searchInput = viewChild.required<ElementRef>('searchInput');

  readonly #searchControl = new FormControl<string>('');
  readonly formGroup = new FormGroup<SearchForm>({
    search: this.#searchControl,
  });

  private scrollTop: number;

  @HostBinding('class.scrolled') get scrolled(): boolean {
    return this.scrollTop > 0;
  }

  readonly #searchResults$ = new BehaviorSubject<BrowserTabs>([]);
  readonly searchQuery$: Observable<string> = this.navService.paramsSearch$.pipe(shareReplay(1));

  /**
   * Recently used tabs
   */
  recentTabs$: Observable<BrowserTabs>;

  constructor(
    private cdr: ChangeDetectorRef,
    private collectionsService: CollectionsService,
    private navService: NavService,
    private readonly tabService: TabService
  ) {
    super();

    effect(() => {
      const disabled = this.disabled();

      if (disabled) {
        this.#searchControl.disable();
      } else {
        this.#searchControl.enable();
      }

      this._disabled = disabled;
    });
  }

  ngOnInit() {
    const paramChanges = this.navService.paramsSearch$.subscribe((value) =>
      this.#searchControl.setValue(value, {
        emitEvent: false,
      })
    );

    const formChanges = this.formGroup.valueChanges.subscribe(({ search }) => this.searchChange(search));

    const fuse = new Fuse<BrowserTab>([], fuseOptions);

    const fuse$: Observable<Fuse<BrowserTab>> = this.#source$.pipe(
      filter((source) => source?.length > 0),
      map((source) => {
        fuse.setCollection(source);
        return fuse;
      })
    );

    const resultChanges = this.searchQuery$
      .pipe(
        filter((searchQuery) => searchQuery?.length > 0),
        distinctUntilChanged(),
        switchMap((searchValue) =>
          fuse$.pipe(
            take(1),
            map((fuse) => fuse.search(searchValue).map(({ item }) => item))
          )
        )
      )
      .subscribe((tabs) => this.#searchResults$.next(tabs));

    this.sourceTabs$ = combineLatest([this.searchQuery$, this.#searchResults$, this.#source$]).pipe(
      map(([searchQuery, searchResults, source]) => {
        if (searchQuery?.length) {
          return searchResults;
        }

        return source.sort((a, b) => b.id - a.id).slice(0, LATEST_LIMIT);
      }),
      shareReplay(1)
    );

    this.recentTabs$ = combineLatest([this.tabService.recentTabs$, this.#source$]).pipe(
      map(([recentTabs, tabs]) =>
        this.tabService.sortByRecent(
          tabs?.filter((tab) => recentTabs?.[tab.id]),
          recentTabs
        )
      ),
      shareReplay(1)
    );

    const fuseDevices$: Observable<Fuse<BrowserTab>> = this.#devices$.pipe(
      filter((devices) => devices?.length > 0),
      map((devices) => new Fuse(devices, fuseOptions)),
      take(1)
    );

    this.deviceTabs$ = this.searchQuery$.pipe(
      switchMap((search) => {
        if (search) {
          return fuseDevices$.pipe(map((fuse) => fuse.search(search)?.map(({ item }) => item)));
        }

        return of([]);
      }),
      shareReplay(1)
    );

    this.subscribe(paramChanges, resultChanges, formChanges);
  }

  clearSearch() {}

  handleAction(action: Action) {
    this.collectionsService.handleAction(action);
  }

  async searchChange(value: string) {
    await this.navService.search(value);
  }
}

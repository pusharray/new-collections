import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { of } from 'rxjs';
import { NavService } from './nav.service';

describe('NavService', () => {
  let spectator: SpectatorService<NavService>;
  const createService = createServiceFactory({
    service: NavService,
    imports: [MatSnackBarModule, MatBottomSheetModule],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          queryParams: of({
            groupId: '7dd29b1c-dfab-44d4-8d29-76d402d24038',
          }),
        },
      },
      {
        provide: Router,
        useValue: {
          navigate() {},
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should navigate with values', () => {
    jest.spyOn(spectator.service['router'], 'navigate');

    spectator.service.go('6ab9c99e-8942-4236-ad6e-7e38c51da810', 218);

    expect(spectator.service['router'].navigate).toHaveBeenCalled();
  });
});

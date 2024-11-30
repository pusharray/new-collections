import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'nc-timeline-label',
  templateUrl: './timeline-label.component.html',
  styleUrl: './timeline-label.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TimelineLabelComponent {}

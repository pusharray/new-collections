import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TabGroup } from 'src/app/utils';

/**
 * Expansion panel header layout container.
 */
@Component({
  selector: 'app-panel-header',
  templateUrl: './panel-header.component.html',
  styleUrls: ['./panel-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelHeaderComponent {
  /**
   * Tab group.
   */
  @Input() group: TabGroup;
}

import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, HostBinding, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { getFaviconUrl, IconSize, ImageSource } from '../../utils';

/**
 * @description
 *
 * Displays images as small icons.
 */
@Component({
  selector: 'nc-image',
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class ImageComponent {
  /**
   * Image source path.
   */
  readonly source = input<ImageSource>();

  /**
   * Icon size.
   */
  readonly size = input<IconSize>('medium');

  readonly imageSrc = signal<ImageSource>('');

  @HostBinding('class.medium') get medium(): boolean {
    return this.size() === 'medium';
  }

  @HostBinding('class.small') get small(): boolean {
    return this.size() === 'small';
  }

  constructor(private sanitizer: DomSanitizer) {
    effect(() => this.imageSrc.set(this.source()), { allowSignalWrites: true });
  }

  /**
   * Handles image loading error
   */
  onError() {
    if (typeof this.source() === 'string') {
      const source = this.source() as string;
      try {
        const favicon = getFaviconUrl(source);
        const newSrc = this.sanitizer.bypassSecurityTrustUrl(favicon);
        this.imageSrc.set(newSrc);
      } catch (e) {}
    }
  }
}

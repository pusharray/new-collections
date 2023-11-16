import { Directive, HostListener, Input } from '@angular/core';

/**
 * @description
 * 
 * Prevents event propagation on clicked element.
 */
@Directive({
  selector: '[appStopPropagation]',
})
export class StopPropagationDirective {

  @HostListener('click', ['$event']) onClick(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { getUrlHostname } from 'src/app/utils';

/**
 * @description
 *
 * Transforms URL to hostname
 */
@Pipe({
  name: 'hostname',
  standalone: true,
})
export class HostnamePipe implements PipeTransform {
  transform(url: string): unknown {
    return getUrlHostname(url);
  }
}

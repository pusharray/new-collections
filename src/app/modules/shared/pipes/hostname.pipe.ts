import { Pipe, PipeTransform } from '@angular/core';
import { hostname } from 'src/app/utils';

/**
 * @description
 *
 * Transforms URL to hostname
 */
@Pipe({
  name: 'hostname',
})
export class HostnamePipe implements PipeTransform {
  transform(url: string): unknown {
    return hostname(url);
  }
}
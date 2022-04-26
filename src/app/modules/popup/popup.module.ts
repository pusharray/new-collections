import { MatFabMenuModule } from '@angular-material-extensions/fab-menu';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared';
import { LayoutComponent } from './layout/layout.component';

const routes: Routes = [{ path: '', component: LayoutComponent }];

@NgModule({
  declarations: [LayoutComponent],
  imports: [CommonModule, SharedModule, MatFabMenuModule, RouterModule.forChild(routes)],
})
export class PopupModule {}

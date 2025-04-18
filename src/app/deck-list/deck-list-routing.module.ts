import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DeckListPage } from './deck-list.page';

const routes: Routes = [
  {
    path: '',
    component: DeckListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeckListPageRoutingModule {}

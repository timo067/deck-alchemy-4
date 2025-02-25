import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CardSearchPage } from './card-search.page';

const routes: Routes = [
  {
    path: '',
    component: CardSearchPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CardSearchPageRoutingModule {}

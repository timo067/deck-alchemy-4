import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DeckEditorPage } from './deck-editor.page';

const routes: Routes = [
  {
    path: '',
    component: DeckEditorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeckEditorPageRoutingModule {}

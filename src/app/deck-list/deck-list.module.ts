import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DeckListPageRoutingModule } from './deck-list-routing.module';

import { DeckListPage } from './deck-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DeckListPageRoutingModule
  ],
  declarations: [DeckListPage]
})
export class DeckListPageModule {}

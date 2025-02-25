import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';  // Import HttpClientModule

import { CardSearchPageRoutingModule } from './card-search-routing.module';

import { CardSearchPage } from './card-search.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CardSearchPageRoutingModule,
    HttpClientModule  // Add HttpClientModule here
  ],
  declarations: [CardSearchPage]
})
export class CardSearchPageModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DeckEditorPageRoutingModule } from './deck-editor-routing.module';

import { DeckEditorPage } from './deck-editor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DeckEditorPageRoutingModule
  ],
  declarations: [DeckEditorPage]
})
export class DeckEditorPageModule {}

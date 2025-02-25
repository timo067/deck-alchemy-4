import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeckEditorPage } from './deck-editor.page';

describe('DeckEditorPage', () => {
  let component: DeckEditorPage;
  let fixture: ComponentFixture<DeckEditorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DeckEditorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

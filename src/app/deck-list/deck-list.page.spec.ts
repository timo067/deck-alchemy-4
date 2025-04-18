import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeckListPage } from './deck-list.page';

describe('DeckListPage', () => {
  let component: DeckListPage;
  let fixture: ComponentFixture<DeckListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DeckListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

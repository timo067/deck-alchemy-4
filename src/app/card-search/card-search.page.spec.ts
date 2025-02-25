import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardSearchPage } from './card-search.page';

describe('CardSearchPage', () => {
  let component: CardSearchPage;
  let fixture: ComponentFixture<CardSearchPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CardSearchPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameBoardPage } from './game-board.page';

describe('GameBoardPage', () => {
  let component: GameBoardPage;
  let fixture: ComponentFixture<GameBoardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GameBoardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

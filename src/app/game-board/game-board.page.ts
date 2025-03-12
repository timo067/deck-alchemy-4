import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.page.html',
  styleUrls: ['./game-board.page.scss'],
  standalone: false
})
export class GameBoardPage implements OnInit {
  playerDeck: any = { name: '', cards: [] };
  opponentDeck: any = { name: '', cards: [] };
  playerHand: Array<{ name: string, type: string, imageUrl: string, atk: number, def: number }> = [];
  opponentHand: Array<{ name: string, type: string, imageUrl: string, atk: number, def: number }> = [];
  playerMonsterCards: Array<{ name: string, type: string, imageUrl: string, atk: number, def: number }> = [];
  opponentMonsterCards: Array<{ name: string, type: string, imageUrl: string, atk: number, def: number }> = [];
  selectedCard: any = null;
  selectedTarget: any = null;
  lifePoints: number = 8000;
  opponentLifePoints: number = 8000;
  duelResult: string = '';
  showPlayerCards: boolean = false; // Track visibility of player's cards
  showOpponentCards: boolean = false; // Track visibility of opponent's cards
  playerTurn: boolean = true; // Track whose turn it is
  phase: string = 'draw'; // Track the current phase of the turn

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const state = history.state;
    this.playerDeck = state.playerDeck || { name: '', cards: [] };
    this.opponentDeck = state.opponentDeck || { name: '', cards: [] };

    this.playerMonsterCards = this.playerDeck.cards.filter((card: any) => card.type === 'Normal Monster');
    this.opponentMonsterCards = this.opponentDeck.cards.filter((card: any) => card.type === 'Normal Monster');

    this.drawInitialCards();
  }

  drawInitialCards() {
    this.playerHand = this.drawCards(this.playerDeck.cards, 5);
    this.opponentHand = this.drawCards(this.opponentDeck.cards, 5);

    console.log('Player Hand:', this.playerHand);
    console.log('Opponent Hand:', this.opponentHand);
  }

  drawCards(deck: any[], count: number): any[] {
    const shuffledDeck = [...deck].sort(() => 0.5 - Math.random());
    return shuffledDeck.slice(0, count);
  }

  drawCard() {
    if (this.playerTurn) {
      const newCard = this.drawCards(this.playerDeck.cards, 1)[0];
      this.playerHand.push(newCard);
      console.log('Player draws card:', newCard);
    } else {
      const newCard = this.drawCards(this.opponentDeck.cards, 1)[0];
      this.opponentHand.push(newCard);
      console.log('Opponent draws card:', newCard);
    }
  }

  togglePlayerCards() {
    this.showPlayerCards = !this.showPlayerCards;
  }

  toggleOpponentCards() {
    this.showOpponentCards = !this.showOpponentCards;
  }

  selectCard(card: any) {
    if (this.phase === 'battle') {
      if (this.playerTurn) {
        this.selectedCard = card;
        console.log('Selected card for attack:', card);
      } else {
        this.selectedTarget = card;
        console.log('Selected target for attack:', card);
      }
    }
  }

  playCard(card: any) {
    if (this.phase === 'main') {
      if (this.playerTurn) {
        // Player's turn logic
        console.log('Playing card:', card);
        this.playerMonsterCards.push(card);
        this.playerHand = this.playerHand.filter(c => c !== card);
      } else {
        // Opponent's turn logic
        console.log('Playing card:', card);
        this.opponentMonsterCards.push(card);
        this.opponentHand = this.opponentHand.filter(c => c !== card);
      }
      this.selectedCard = null; // Clear the selected card after playing
    }
  }

  attack() {
    if (this.phase === 'battle' && this.selectedCard && this.selectedTarget) {
      if (this.playerTurn) {
        // Player attacks opponent
        if (this.selectedCard.atk > this.selectedTarget.def) {
          this.opponentLifePoints -= (this.selectedCard.atk - this.selectedTarget.def);
          console.log('Opponent life points:', this.opponentLifePoints);
          this.opponentMonsterCards = this.opponentMonsterCards.filter(c => c !== this.selectedTarget);
        } else {
          this.lifePoints -= (this.selectedTarget.def - this.selectedCard.atk);
          console.log('Player life points:', this.lifePoints);
          this.playerMonsterCards = this.playerMonsterCards.filter(c => c !== this.selectedCard);
        }
      } else {
        // Opponent attacks player
        if (this.selectedCard.atk > this.selectedTarget.def) {
          this.lifePoints -= (this.selectedCard.atk - this.selectedTarget.def);
          console.log('Player life points:', this.lifePoints);
          this.playerMonsterCards = this.playerMonsterCards.filter(c => c !== this.selectedTarget);
        } else {
          this.opponentLifePoints -= (this.selectedTarget.def - this.selectedCard.atk);
          console.log('Opponent life points:', this.opponentLifePoints);
          this.opponentMonsterCards = this.opponentMonsterCards.filter(c => c !== this.selectedCard);
        }
      }
      this.checkGameEnd();
      this.endTurn();
    } else {
      console.log('Select both an attacking card and a target card.');
    }
  }

  checkGameEnd() {
    if (this.lifePoints <= 0) {
      this.duelResult = 'You lose!';
      alert(this.duelResult);
      this.resetGame();
    } else if (this.opponentLifePoints <= 0) {
      this.duelResult = 'You win!';
      alert(this.duelResult);
      this.resetGame();
    }
  }

  resetGame() {
    this.lifePoints = 8000;
    this.opponentLifePoints = 8000;
    this.playerTurn = true;
    this.playerHand = [];
    this.opponentHand = [];
    this.playerMonsterCards = [];
    this.opponentMonsterCards = [];
    this.drawInitialCards();
    console.log('Game reset');
  }

  endTurn() {
    this.playerTurn = !this.playerTurn;
    this.selectedCard = null;
    this.selectedTarget = null;
    this.phase = 'draw';
    this.drawCard();
    console.log('Turn ended. Player turn:', this.playerTurn);
  }

  nextPhase() {
    if (this.phase === 'draw') {
      this.phase = 'main';
    } else if (this.phase === 'main') {
      this.phase = 'battle';
    } else if (this.phase === 'battle') {
      this.phase = 'end';
      this.endTurn();
    }
    console.log('Phase:', this.phase);
  }
}
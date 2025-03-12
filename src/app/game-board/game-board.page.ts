import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardService } from '../services/card.service';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.page.html',
  styleUrls: ['./game-board.page.scss'],
  standalone: false
})
export class GameBoardPage implements OnInit {
  playerDeck: any[] = [];
  opponentDeck: any[] = [];
  playerHand: any[] = [];
  opponentHand: any[] = [];
  playerMonsterCards: any[] = [];
  opponentMonsterCards: any[] = [];
  selectedCard: any = null;
  selectedTarget: any = null;
  lifePoints: number = 8000;
  opponentLifePoints: number = 8000;
  duelResult: string = '';
  playerTurn: boolean = true;
  phase: string = 'draw';

  constructor(private cardService: CardService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.cardService.getCards().subscribe(cards => {
      this.playerDeck = this.cardService.getNormalMonsters(cards);
      this.opponentDeck = this.cardService.getNormalMonsters(cards);

      this.drawInitialCards();
    });
  }

  drawInitialCards() {
    this.playerHand = this.drawCards(this.playerDeck, 5);
    this.opponentHand = this.drawCards(this.opponentDeck, 5);

    console.log('Player Hand:', this.playerHand);
    console.log('Opponent Hand:', this.opponentHand);
  }

  drawCards(deck: any[], count: number): any[] {
    const shuffledDeck = [...deck].sort(() => 0.5 - Math.random());
    return shuffledDeck.slice(0, count);
  }

  drawCard() {
    if (this.playerTurn) {
      const newCard = this.drawCards(this.playerDeck, 1)[0];
      this.playerHand.push(newCard);
      console.log('Player draws card:', newCard);
    } else {
      const newCard = this.drawCards(this.opponentDeck, 1)[0];
      this.opponentHand.push(newCard);
      console.log('Opponent draws card:', newCard);
    }
  }

  selectCard(card: any) {
    if (this.phase === 'battle' && this.playerTurn) {
      this.selectedCard = card;
      console.log('Selected card for attack:', card);
    }
  }

  selectTarget(card: any) {
    if (this.phase === 'battle' && !this.playerTurn) {
      this.selectedTarget = card;
      console.log('Selected target for attack:', card);
    }
  }

  playCard(card: any) {
    if (this.phase === 'main') {
      if (this.playerTurn) {
        console.log('Playing card:', card);
        this.playerMonsterCards.push(card);
        this.playerHand = this.playerHand.filter(c => c !== card);
      } else {
        console.log('Playing card:', card);
        this.opponentMonsterCards.push(card);
        this.opponentHand = this.opponentHand.filter(c => c !== card);
      }
      this.selectedCard = null;
    }
  }

  attack() {
    if (this.phase === 'battle' && this.selectedCard && this.selectedTarget) {
      if (this.playerTurn) {
        if (this.selectedCard.atk > this.selectedTarget.def) {
          this.opponentLifePoints -= (this.selectedCard.atk - this.selectedTarget.def);
          console.log('Opponent life points:', this.opponentLifePoints);
          this.opponentMonsterCards = this.opponentMonsterCards.filter(c => c !== this.selectedTarget);
        } else {
          this.lifePoints -= (this.selectedTarget.atk - this.selectedCard.atk);
          console.log('Player life points:', this.lifePoints);
          this.playerMonsterCards = this.playerMonsterCards.filter(c => c !== this.selectedCard);
        }
      } else {
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

    if (!this.playerTurn) {
      this.opponentTurn();
    }
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

  opponentTurn() {
    // Opponent draws a card
    this.drawCard();

    // Opponent plays a random card from their hand if they have any
    if (this.opponentHand.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.opponentHand.length);
      const cardToPlay = this.opponentHand[randomIndex];
      this.playCard(cardToPlay);
    }

    // Opponent attacks if they have any monster cards on the field
    if (this.opponentMonsterCards.length > 0 && this.playerMonsterCards.length > 0) {
      const attackingCard = this.opponentMonsterCards[0];
      const targetCard = this.playerMonsterCards[0];
      this.selectedCard = attackingCard;
      this.selectedTarget = targetCard;
      this.attack();
    }

    // End opponent's turn
    this.endTurn();
  }
}
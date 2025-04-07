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
  lifePoints: number = 4000;
  opponentLifePoints: number = 4000;
  duelResult: string = '';
  playerTurn: boolean = true;
  phase: string = 'draw';
  background: string = 'default.jpg'; // Fallback background
  clonedCard: { top: number; left: number; image: string } | null = null; // For animation

  constructor(
    private cardService: CardService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;

    if (state) {
      this.playerDeck = state['playerDeck'] || [];
      this.background = state['background']
        ? `assets/images/${state['background']}`
        : 'assets/images/Blue Eyes White Dragon.jpg'; // Default background
    }

    console.log('Player Deck:', this.playerDeck);
    console.log('Opponent Deck:', this.opponentDeck);
    console.log('Background:', this.background);

    this.cardService.getCards().subscribe(cards => {
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
    if (this.phase === 'battle') {
      this.selectedCard = card;
      console.log(`⚔️ Attacking Card Selected: ${card.name}`);
    }
  }

  selectTarget(card: any) {
    if (this.phase === 'battle') {
      this.selectedTarget = card;
      console.log(`🎯 Target Selected: ${card.name}`);
    }
  }

  attack() {
    if (this.phase !== 'battle') {
      console.log('Not in battle phase!');
      return;
    }

    if (!this.selectedCard || !this.selectedTarget) {
      console.log('Select both an attacking card and a target card.');
      return;
    }

    const attackingCardElement = document.querySelector(`[data-card-id="${this.selectedCard.id}"]`);
    const targetCardElement = document.querySelector(`[data-card-id="${this.selectedTarget.id}"]`);

    if (attackingCardElement && targetCardElement) {
      const attackingRect = attackingCardElement.getBoundingClientRect();
      const targetRect = targetCardElement.getBoundingClientRect();

      const cardImage = this.selectedCard.card_images?.[0]?.image_url || 'assets/images/default-card.jpg';

      this.clonedCard = {
        top: attackingRect.top,
        left: attackingRect.left,
        image: cardImage,
      };

      (attackingCardElement as HTMLElement).style.visibility = 'hidden';

      setTimeout(() => {
        this.clonedCard = {
          ...this.clonedCard,
          top: targetRect.top,
          left: targetRect.left,
        };

        setTimeout(() => {
          this.clonedCard = null;
          (attackingCardElement as HTMLElement).style.visibility = 'visible';
          this.performAttack();
        }, 1000); // Match the animation duration
      }, 0);
    }
  }

  performAttack() {
    if (this.playerTurn) {
      if (this.selectedCard.atk > this.selectedTarget.def) {
        this.opponentLifePoints -= this.selectedCard.atk - this.selectedTarget.def;
        this.opponentMonsterCards = this.opponentMonsterCards.filter(c => c !== this.selectedTarget);
      } else {
        this.lifePoints -= this.selectedTarget.atk - this.selectedCard.atk;
        this.playerMonsterCards = this.playerMonsterCards.filter(c => c !== this.selectedCard);
      }
    } else {
      if (this.selectedCard.atk > this.selectedTarget.def) {
        this.lifePoints -= this.selectedCard.atk - this.selectedTarget.def;
        this.playerMonsterCards = this.playerMonsterCards.filter(c => c !== this.selectedTarget);
      } else {
        this.opponentLifePoints -= this.selectedTarget.def - this.selectedCard.atk;
        this.opponentMonsterCards = this.opponentMonsterCards.filter(c => c !== this.selectedCard);
      }
    }

    this.selectedCard = null;
    this.selectedTarget = null;
    this.checkGameEnd();
  }

  checkGameEnd() {
    if (this.lifePoints <= 0) {
      this.duelResult = 'You lose!';
      alert(this.duelResult);
      this.router.navigate(['default']); // Navigate to the default page
    } else if (this.opponentLifePoints <= 0) {
      this.duelResult = 'You win!';
      alert(this.duelResult);
      this.router.navigate(['default']); // Navigate to the default page
    }
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
    this.drawCard();

    if (this.opponentHand.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.opponentHand.length);
      const cardToPlay = this.opponentHand[randomIndex];

      console.log('Opponent plays:', cardToPlay);
      this.opponentMonsterCards.push(cardToPlay);

      this.opponentHand = this.opponentHand.filter(c => c !== cardToPlay);
    }

    if (this.opponentMonsterCards.length > 0 && this.playerMonsterCards.length > 0) {
      const attackingCard = this.opponentMonsterCards[0];
      const targetCard = this.playerMonsterCards[0];

      this.selectedCard = attackingCard;
      this.selectedTarget = targetCard;

      console.log('Opponent attacks with:', attackingCard);
      this.attack();
    }

    this.endTurn();
  }
}
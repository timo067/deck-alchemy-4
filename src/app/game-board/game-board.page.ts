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
  clonedCard: { top: number; left: number; image: string } | null = null;
  clonedCardAnimating: boolean = false;
  transformStyle: string = '';
  explosion: { top: number; left: number } | null = null;
  

  constructor(
    private cardService: CardService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit() {
    // Get navigation state
    const navigation = this.router.getCurrentNavigation();
  const state = navigation?.extras?.state;
  
  if (state) {
    this.playerDeck = state['playerDeck'] || [];
    this.background = state['background']
      ? `assets/images/${state['background']}`
      : 'assets/images/Blue Eyes White Dragon.jpg'; // Default background
  }

    // If a background was passed, use it; otherwise, set a default
    this.background = state?.['background'] ? `assets/images/${state['background']}` : 'assets/images/Blue Eyes White Dragon.jpg';
  
    console.log("Selected Background:", this.background);
  
    // Fetch Cards & Initialize Decks
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
      // Remove the class from the previously selected card
      const previousSelectedCard = document.querySelector('.selected-card');
      if (previousSelectedCard) {
        previousSelectedCard.classList.remove('selected-card');
      }
  
      this.selectedCard = card;
      console.log(`⚔️ Attacking Card Selected: ${card.name}`);
  
      // Add the class to the newly selected card
      const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
      if (cardElement) {
        cardElement.classList.add('selected-card');
      }
    }
  }

  selectTarget(card: any) {
  if (this.phase === 'battle') {
    // Remove the class from the previously selected target
    const previousTargetCard = document.querySelector('.targeted-card');
    if (previousTargetCard) {
      previousTargetCard.classList.remove('targeted-card');
    }

    this.selectedTarget = card;
    console.log(`🎯 Target Selected: ${card.name}`);

    // Add the class to the newly selected target
    const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
    if (cardElement) {
      cardElement.classList.add('targeted-card');
    }

    this.attack(); // Automatically attack after selecting a target
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
    if (this.phase !== 'battle') return;
    if (!this.selectedCard || !this.selectedTarget) return;
  
    const attacker = document.querySelector(`[data-card-id="${this.selectedCard.id}"]`) as HTMLElement;
    const target = document.querySelector(`[data-card-id="${this.selectedTarget.id}"]`) as HTMLElement;
    if (!attacker || !target) return;
  
    const attackerRect = attacker.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
  
    const deltaX = targetRect.left - attackerRect.left;
    const deltaY = targetRect.top - attackerRect.top;
  
    // Add CSS classes for color change
    attacker.classList.add('attacking-card');
    target.classList.add('targeted-card');
  
    this.clonedCard = {
      top: attackerRect.top,
      left: attackerRect.left,
      image: this.selectedCard.card_images[0]?.image_url ?? 'assets/images/default-card.jpg',
    };
  
    attacker.style.visibility = 'hidden';
  
    setTimeout(() => {
      this.transformStyle = `translate(${deltaX}px, ${deltaY}px) scale(1.2)`;
    }, 10);
  
    setTimeout(() => {
      this.clonedCard = null;
      this.transformStyle = '';
      attacker.style.visibility = 'visible';
  
      // Remove CSS classes after the attack
      attacker.classList.remove('attacking-card');
      target.classList.remove('targeted-card');
  
      // Trigger explosion effect before attack logic
      this.triggerExplosion(targetRect);
      this.performAttack();
    }, 600); // Match the animation duration
  }
  
  triggerExplosion(targetRect: DOMRect) {
    this.explosion = {
      top: targetRect.top,
      left: targetRect.left,
    };
  
    setTimeout(() => {
      this.explosion = null;
    }, 600); // Match with fadeOut duration in SCSS
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

  // changeBackground(backgroundImage: string) {
  //   this.selectedBackground = backgroundImage;
  // }
  
  opponentTurn() {
    // Opponent draws a card
    this.drawCard();

    // Opponent plays a random card from their hand if they have any
    if (this.opponentHand.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.opponentHand.length);
      const cardToPlay = this.opponentHand[randomIndex];

      console.log('Opponent plays:', cardToPlay);
      this.opponentMonsterCards.push(cardToPlay);

      // Remove card from opponent's hand
      this.opponentHand = this.opponentHand.filter(c => c !== cardToPlay);
    }

    // Opponent attacks if they have monsters
    if (this.opponentMonsterCards.length > 0 && this.playerMonsterCards.length > 0) {
      const attackingCard = this.opponentMonsterCards[0]; // First monster
      const targetCard = this.playerMonsterCards[0]; // First player's monster

      this.selectedCard = attackingCard;
      this.selectedTarget = targetCard;

      console.log('Opponent attacks with:', attackingCard);
      this.attack();
    }

    // End opponent's turn
    this.endTurn();
  }
}
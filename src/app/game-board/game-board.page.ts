import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardService } from '../services/card.service';
import { Renderer2 } from '@angular/core';
import { gsap } from 'gsap';

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
  clonedCard: { top: number; left: number; image: string, transformStyle:string } | null = null;
  clonedCardAnimating: boolean = false;
  transformStyle: string = '';
  explosion: { top: number; left: number } | null = null;
  hasSummonedThisTurn: boolean = false; // New flag to track if a card has been summoned
  randomBoost: { attribute: string; stat: string; percentage: number } | null = null; // Store the random boost with stat


  constructor(
    private cardService: CardService,
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2
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
      this.applyRandomBoost();
    });
  }
  
  applyRandomBoost() {
  const attributes = ['Wind', 'Dark', 'Fire', 'Water', 'Earth', 'Light']; // Define the card attributes
  const stats = ['atk', 'def']; // Define the stats that can be boosted (ATK or DEF)
  
  const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];
  const randomStat = stats[Math.floor(Math.random() * stats.length)]; // Randomly choose ATK or DEF
  const randomPercentage = Math.floor(Math.random() * 21) + 10; // Random boost between 10% and 30%

  this.randomBoost = { attribute: randomAttribute, stat: randomStat, percentage: randomPercentage };

  console.log(`Random Boost: ${randomAttribute} ${randomStat.toUpperCase()} +${randomPercentage}%`);

  // Apply the boost and mark boosted cards in the player's deck
  this.playerDeck.forEach(card => {
    if (card.attribute === randomAttribute) {
      card[randomStat] = Math.floor(card[randomStat] * (1 + randomPercentage / 100)); // Boost the selected stat
      card.isBoosted = true; // Mark the card as boosted
    } else {
      card.isBoosted = false; // Ensure other cards are not marked
    }
  });

  // Apply the boost and mark boosted cards in the opponent's deck
  this.opponentDeck.forEach(card => {
    if (card.attribute === randomAttribute) {
      card[randomStat] = Math.floor(card[randomStat] * (1 + randomPercentage / 100)); // Boost the selected stat
      card.isBoosted = true; // Mark the card as boosted
    } else {
      card.isBoosted = false; // Ensure other cards are not marked
    }
  });
}

  initializeGame() {
    console.log('Game initialized with random boost:', this.randomBoost);
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

summonCard(card: any, isPlayer: boolean) {
  // Create the summoned card element
  const summonedCard = this.renderer.createElement('div');
  this.renderer.addClass(summonedCard, 'summoned-card');

  // Set the card's image as the background
  this.renderer.setStyle(
    summonedCard,
    'background-image',
    `url(${card.card_images[0]?.image_url || 'assets/images/default-card.jpg'})`
  );

  // Set initial position (off-screen)
  this.renderer.setStyle(summonedCard, 'position', 'fixed');
  this.renderer.setStyle(summonedCard, 'top', isPlayer ? '100vh' : '-150px'); // Player summons from bottom, opponent from top
  this.renderer.setStyle(summonedCard, 'left', '50%');
  this.renderer.setStyle(summonedCard, 'transform', 'translateX(-50%)');
  this.renderer.setStyle(summonedCard, 'width', '120px');
  this.renderer.setStyle(summonedCard, 'height', '180px');
  this.renderer.setStyle(summonedCard, 'background-size', 'cover');
  this.renderer.setStyle(summonedCard, 'z-index', '1000');

  // Append the summoned card to the body
  this.renderer.appendChild(document.body, summonedCard);

  // Use GSAP to animate the card to its final position
  gsap.fromTo(
    summonedCard,
    { top: isPlayer ? '100vh' : '-150px' }, // Start position
    {
      top: isPlayer ? '50vh' : '30vh', // End position
      duration: 0.5, // Animation duration
      ease: 'power2.out', // Easing function
      onComplete: () => {
        // Remove the summoned card element after the animation
        this.renderer.removeChild(document.body, summonedCard);

        // Add the card to the field
        if (isPlayer) {
          this.playerMonsterCards.push(card);
        } else {
          this.opponentMonsterCards.push(card);
        }
      },
    }
  );
}

  playCard(card: any) {
    if (this.phase === 'main') {
      if (this.hasSummonedThisTurn) {
        alert('You can only summon one card per turn!');
        return;
      }

      if (this.playerTurn) {
        console.log('Playing card:', card);
        this.summonCard(card, true); // Trigger summon animation for the player
        this.playerHand = this.playerHand.filter(c => c !== card);
      } else {
        console.log('Playing card:', card);
        this.summonCard(card, false); // Trigger summon animation for the opponent
        this.opponentHand = this.opponentHand.filter(c => c !== card);
      }

      this.selectedCard = null;
      this.hasSummonedThisTurn = true; // Mark that a card has been summoned this turn
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
  
    // Clone the card for animation
    this.clonedCard = {
      top: attackerRect.top,
      left: attackerRect.left,
      transformStyle: `translate(${deltaX}px, ${deltaY}px) scale(1.2)`,
      image: this.selectedCard.card_images[0]?.image_url ?? 'assets/images/default-card.jpg',
    };
  
    // Use GSAP to animate the cloned card
    const clonedElement = this.renderer.createElement('div');
    this.renderer.setStyle(clonedElement, 'position', 'fixed');
    this.renderer.setStyle(clonedElement, 'top', `${attackerRect.top}px`);
    this.renderer.setStyle(clonedElement, 'left', `${attackerRect.left}px`);
    this.renderer.setStyle(clonedElement, 'width', '120px');
    this.renderer.setStyle(clonedElement, 'height', '180px');
    this.renderer.setStyle(clonedElement, 'background-image', `url(${this.clonedCard.image})`);
    this.renderer.setStyle(clonedElement, 'background-size', 'cover');
    this.renderer.setStyle(clonedElement, 'z-index', '1000');
    this.renderer.appendChild(document.body, clonedElement);
  
    gsap.to(clonedElement, {
      x: deltaX,
      y: deltaY,
      scale: 1.2,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => {
        // Remove the cloned card after the animation
        this.renderer.removeChild(document.body, clonedElement);
  
        // Trigger explosion effect
        this.triggerExplosion(targetRect);
  
        // Perform the attack logic
        this.performAttack();
      },
    });
  }
  
  triggerExplosion(targetRect: DOMRect) {
    const explosionElement = this.renderer.createElement('div');
    this.renderer.addClass(explosionElement, 'explosion');
    this.renderer.setStyle(explosionElement, 'position', 'fixed');
    this.renderer.setStyle(explosionElement, 'top', `${targetRect.top}px`);
    this.renderer.setStyle(explosionElement, 'left', `${targetRect.left}px`);
    this.renderer.setStyle(explosionElement, 'width', '120px');
    this.renderer.setStyle(explosionElement, 'height', '120px');
    this.renderer.setStyle(explosionElement, 'background-image', 'url(/assets/images/explosion.png)');
    this.renderer.setStyle(explosionElement, 'background-size', 'contain');
    this.renderer.setStyle(explosionElement, 'z-index', '1000');
    this.renderer.appendChild(document.body, explosionElement);
  
    gsap.fromTo(
      explosionElement,
      { scale: 1, opacity: 1 },
      {
        scale: 1.6,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          this.renderer.removeChild(document.body, explosionElement);
        },
      }
    );
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
    this.hasSummonedThisTurn = false; // Reset the summon flag for the next turn
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
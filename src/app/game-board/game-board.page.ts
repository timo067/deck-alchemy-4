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
  background: string = 'ChatGPT Image May 7, 2025, 11_05_23 PM.png'; // Fallback background
  clonedCard: { top: number; left: number; image: string, transformStyle: string } | null = null;
  clonedCardAnimating: boolean = false;
  transformStyle: string = '';
  explosion: { top: number; left: number } | null = null;
  hasSummonedThisTurn: boolean = false; // New flag to track if a card has been summoned
  randomBoost: { attribute: string; stat: string; percentage: number } | null = null; // Store the random boost with stat
  hasAttackedThisTurn: boolean = false;
  errorMessage: string | null = null; // Store the error message
  discardModalVisible: boolean = false; // Track if the discard modal is visible

  constructor(
    private cardService: CardService,
    private route: ActivatedRoute,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;
  
    if (state) {
      // Normalize the player deck
      this.playerDeck = (state['playerDeck'] || []).map((card: any) => this.normalizeCard(card));
    }
  
    // Fetch and normalize the opponent deck
    this.cardService.getCards().subscribe(cards => {
      this.opponentDeck = this.cardService.getNormalMonsters(cards).map(card => this.normalizeCard(card));
      this.drawInitialCards();
      this.applyRandomBoost();
  
      console.log('Opponent Monster Cards:', this.opponentMonsterCards);
    });
  
    console.log('Normalized Player Deck:', this.playerDeck);
  
    // Add a keyboard event listener for the TAB key
    window.addEventListener('keydown', this.handleKeyPress.bind(this));
  }
  
  ngOnDestroy() {
    // Remove the keyboard event listener when the component is destroyed
    window.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }
  
  handleKeyPress(event: KeyboardEvent) {
    if (this.discardModalVisible) {
      const key = parseInt(event.key, 10);
      if (!isNaN(key) && key >= 1 && key <= this.playerHand.length) {
        // Select the card corresponding to the pressed number
        const cardToDiscard = this.playerHand[key - 1];
        this.discardCardFromModal(cardToDiscard);
      }
    } else if (event.key === 'Tab') {
      event.preventDefault(); // Prevent the default browser behavior for TAB
      this.nextPhase(); // Call the method to switch to the next phase
    }
  }

  // Method to display an error message
  showError(message: string) {
    this.errorMessage = message;
  }

  // Method to clear the error message
  clearErrorMessage() {
    this.errorMessage = null;
  }

  normalizeCard(card: any): any {
    return {
      id: card.id || null,
      name: card.name || 'Unknown Card',
      imageUrl: card.imageUrl || (card.card_images?.[0]?.image_url || 'assets/images/default-card.jpg'),
      atk: card.atk || 0,
      def: card.def || 0,
      attribute: card.attribute || 'Unknown',
      archetype: card.archetype || 'None',
      race: card.race || 'Unknown',
      type: card.type || 'Unknown',
      level: card.level || 0,
      desc: card.desc || 'No description available.',
      isBoosted: card.isBoosted || false,
      card_images: card.card_images || [{ image_url: 'assets/images/default-card.jpg' }],
      card_prices: card.card_prices || [],
      card_sets: card.card_sets || [],
      frameType: card.frameType || 'Unknown',
      humanReadableCardType: card.humanReadableCardType || 'Unknown',
      typeline: card.typeline || [],
      ygoprodeck_url: card.ygoprodeck_url || ''
    };
  }

  applyRandomBoost() {
    const attributes = ['Wind', 'Dark', 'Fire', 'Water', 'Earth', 'Light'];
    const stats = ['atk', 'def'];
  
    const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];
    const randomStat = stats[Math.floor(Math.random() * stats.length)];
    const randomPercentage = Math.floor(Math.random() * 21) + 10;
  
    this.randomBoost = { attribute: randomAttribute, stat: randomStat, percentage: randomPercentage };
  
    console.log(`Random Boost: ${randomAttribute} ${randomStat.toUpperCase()} +${randomPercentage}%`);
  
    // Normalize the attribute comparison to avoid case sensitivity issues
    this.playerDeck.forEach(card => {
      if (card.attribute?.toLowerCase() === randomAttribute.toLowerCase()) {
        card[randomStat] = Math.floor(card[randomStat] * (1 + randomPercentage / 100));
        card.isBoosted = true;
      } else {
        card.isBoosted = false;
      }
    });
  
    this.opponentDeck.forEach(card => {
      if (card.attribute?.toLowerCase() === randomAttribute.toLowerCase()) {
        card[randomStat] = Math.floor(card[randomStat] * (1 + randomPercentage / 100));
        card.isBoosted = true;
      } else {
        card.isBoosted = false;
      }
    });
  }

  drawInitialCards() {
    this.playerHand = this.drawCards(this.playerDeck, 5);
    this.opponentHand = this.drawCards(this.opponentDeck, 5);
  
    // Check hand limits after the initial draw
    if (this.playerHand.length > 7) {
      this.showError('⚠️ Your hand is full! Please discard a card to continue.');
      this.promptPlayerToDiscard();
    }
  
    if (this.opponentHand.length > 7) {
      this.discardRandomCard(false);
    }
  
    console.log('Player Hand:', this.playerHand);
    console.log('Opponent Hand:', this.opponentHand);
  }

  discardCard(card: any, isPlayer: boolean): void {
    if (isPlayer) {
      this.playerHand = this.playerHand.filter(c => c !== card);
      console.log(`Player discarded: ${card.name}`);
    } else {
      this.opponentHand = this.opponentHand.filter(c => c !== card);
      console.log(`Opponent discarded: ${card.name}`);
    }
  }

  promptPlayerToDiscard(): void {
    this.discardModalVisible = true;
  }

  // Close the discard modal
  closeDiscardModal(): void {
    this.discardModalVisible = false;
  }

  // Discard a card from the modal
  discardCardFromModal(card: any): void {
    this.discardCard(card, true); // Discard the selected card
    this.closeDiscardModal(); // Close the modal
  }

  discardRandomCard(isPlayer: boolean): void {
    if (!isPlayer && this.opponentHand.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.opponentHand.length);
      const cardToDiscard = this.opponentHand[randomIndex];
      this.discardCard(cardToDiscard, false);
    }
  }

  drawCards(deck: any[], count: number): any[] {
    const shuffledDeck = [...deck].sort(() => 0.5 - Math.random());
    return shuffledDeck.slice(0, count);
  }

  drawCard() {
    if (this.playerTurn) {
      const newCard = this.drawCards(this.playerDeck, 1)[0];
      if (newCard) {
        this.playerHand.push(newCard);
        console.log('Player draws card:', newCard);
  
        // Check if the player's hand exceeds the limit
        if (this.playerHand.length > 7) {
          this.promptPlayerToDiscard();
        }
      }
    } else {
      const newCard = this.drawCards(this.opponentDeck, 1)[0];
      if (newCard) {
        this.opponentHand.push(newCard);
        console.log('Opponent draws card:', newCard);
  
        // Check if the opponent's hand exceeds the limit
        if (this.opponentHand.length > 7) {
          console.log('⚠️ Opponent\'s hand is full! Discarding a random card.');
          this.discardRandomCard(false);
        }
      }
    }
  }

  selectCard(card: any) {
    if (this.phase === 'battle') {
      const previousSelectedCard = document.querySelector('.selected-card');
      if (previousSelectedCard) {
        previousSelectedCard.classList.remove('selected-card');
      }

      this.selectedCard = card;
      console.log(`⚔️ Attacking Card Selected: ${card.name}`);

      const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
      if (cardElement) {
        cardElement.classList.add('selected-card');
      }
    }
  }

  selectTarget(card: any) {
    if (this.phase === 'battle') {
      const previousTargetCard = document.querySelector('.targeted-card');
      if (previousTargetCard) {
        previousTargetCard.classList.remove('targeted-card');
      }

      this.selectedTarget = card;
      console.log(`🎯 Target Selected: ${card.name}`);

      const cardElement = document.querySelector(`[data-card-id="${card.id}"]`);
      if (cardElement) {
        cardElement.classList.add('targeted-card');
      }

      this.attack();
    }
  }

  summonCard(card: any, isPlayer: boolean) {
    const summonedCard = this.renderer.createElement('div');
    this.renderer.addClass(summonedCard, 'summoned-card');

    this.renderer.setStyle(
      summonedCard,
      'background-image',
      `url(${card.imageUrl || 'assets/images/default-card.jpg'})`
    );

    this.renderer.setStyle(summonedCard, 'position', 'fixed');
    this.renderer.setStyle(summonedCard, 'top', isPlayer ? '100vh' : '-150px');
    this.renderer.setStyle(summonedCard, 'left', '50%');
    this.renderer.setStyle(summonedCard, 'transform', 'translateX(-50%)');
    this.renderer.setStyle(summonedCard, 'width', '120px');
    this.renderer.setStyle(summonedCard, 'height', '180px');
    this.renderer.setStyle(summonedCard, 'background-size', 'cover');
    this.renderer.setStyle(summonedCard, 'z-index', '1000');

    this.renderer.appendChild(document.body, summonedCard);

    gsap.fromTo(
      summonedCard,
      { top: isPlayer ? '100vh' : '-150px' },
      {
        top: isPlayer ? '50vh' : '30vh',
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          this.renderer.removeChild(document.body, summonedCard);

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
    console.log('Current Phase:', this.phase);
    if (this.phase !== 'main') {
      this.showError('⚠️ You can only play cards during the Main Phase! Please wait for the correct phase.');
      return;
    }

    if (this.hasSummonedThisTurn) {
      this.showError('⚠️ You can only summon one card per turn! Try again next turn.');
      return;
    }

    if (this.playerTurn) {
      if (this.playerMonsterCards.length >= 5) {
        this.showError('⚠️ Your field is full! You cannot summon more than 5 cards.');
        return;
      }

      console.log('Playing card:', card);
      this.summonCard(card, true);
      this.playerHand = this.playerHand.filter(c => c !== card);
    } else {
      if (this.opponentMonsterCards.length >= 5) {
        this.showError('⚠️ Opponent\'s field is full! They cannot summon more than 5 cards.');
        return;
      }

      console.log('Opponent plays card:', card);
      this.summonCard(card, false);
      this.opponentHand = [...this.opponentHand.filter(c => c !== card)];
    }

    this.selectedCard = null;
    this.hasSummonedThisTurn = true;
  }

  attack() {
    if (this.phase !== 'battle') {
      this.showError('⚠️ You can only attack during the Battle Phase! Wait for the correct phase.');
      return;
    }
    if (!this.selectedCard || !this.selectedTarget) {
      this.showError('⚠️ Please select both an attacking card and a target card before attacking.');
      return;
    }
    if (this.hasAttackedThisTurn) {
      this.showError('⚠️ You can only attack once per turn! Try again next turn.');
      return;
    }
  
    const attacker = document.querySelector(`[data-card-id="${this.selectedCard.id}"]`) as HTMLElement;
    const target = document.querySelector(`[data-card-id="${this.selectedTarget.id}"]`) as HTMLElement;
  
    if (!attacker || !target) {
      console.log('Attacker or target card element not found.');
      return;
    }
  
    const attackerRect = attacker.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
  
    const deltaX = targetRect.left - attackerRect.left;
    const deltaY = targetRect.top - attackerRect.top;
  
    console.log('Starting attack animation...');
    console.log('Attacker:', this.selectedCard);
    console.log('Target:', this.selectedTarget);
  
    const clonedElement = this.renderer.createElement('div');
    this.renderer.setStyle(clonedElement, 'position', 'fixed');
    this.renderer.setStyle(clonedElement, 'top', `${attackerRect.top}px`);
    this.renderer.setStyle(clonedElement, 'left', `${attackerRect.left}px`);
    this.renderer.setStyle(clonedElement, 'width', '120px');
    this.renderer.setStyle(clonedElement, 'height', '180px');
    this.renderer.setStyle(clonedElement, 'background-image', `url(${this.selectedCard.imageUrl})`);
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
        console.log('Attack animation completed.');
        this.renderer.removeChild(document.body, clonedElement);
        this.triggerExplosion(targetRect);
        this.performAttack();
        this.hasAttackedThisTurn = true; // Mark that the player has attacked
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
    const attackerAtk = this.selectedCard?.atk || 0; // Ensure attack points are valid
    const targetDef = this.selectedTarget?.def || 0; // Ensure defense points are valid
  
    console.log('Performing attack...');
    console.log('Attacker ATK:', attackerAtk);
    console.log('Target DEF:', targetDef);
  
    if (this.playerTurn) {
      // Player's attack logic
      if (attackerAtk > targetDef) {
        const damage = attackerAtk - targetDef;
        this.opponentLifePoints = Math.max(this.opponentLifePoints - damage, 0); // Prevent negative life points
        console.log(`Opponent loses ${damage} life points.`);
        this.opponentMonsterCards = this.opponentMonsterCards.filter(c => c !== this.selectedTarget);
      } else if (attackerAtk === targetDef) {
        console.log('Both cards are destroyed.');
        this.playerMonsterCards = this.playerMonsterCards.filter(c => c !== this.selectedCard);
        this.opponentMonsterCards = this.opponentMonsterCards.filter(c => c !== this.selectedTarget);
      } else {
        const damage = targetDef - attackerAtk;
        this.lifePoints = Math.max(this.lifePoints - damage, 0); // Prevent negative life points
        console.log(`Player loses ${damage} life points.`);
        this.playerMonsterCards = this.playerMonsterCards.filter(c => c !== this.selectedCard);
      }
    } else {
      // Opponent's attack logic
      if (attackerAtk > targetDef) {
        const damage = attackerAtk - targetDef;
        this.lifePoints = Math.max(this.lifePoints - damage, 0); // Prevent negative life points
        console.log(`Player loses ${damage} life points.`);
        this.playerMonsterCards = this.playerMonsterCards.filter(c => c !== this.selectedTarget);
      } else if (attackerAtk === targetDef) {
        console.log('Both cards are destroyed.');
        this.opponentMonsterCards = this.opponentMonsterCards.filter(c => c !== this.selectedCard);
        this.playerMonsterCards = this.playerMonsterCards.filter(c => c !== this.selectedTarget);
      } else {
        const damage = targetDef - attackerAtk;
        this.opponentLifePoints = Math.max(this.opponentLifePoints - damage, 0); // Prevent negative life points
        console.log(`Opponent loses ${damage} life points.`);
        this.opponentMonsterCards = this.opponentMonsterCards.filter(c => c !== this.selectedCard);
      }
    }
  
    // Reset selected cards after the attack
    this.selectedCard = null;
    this.selectedTarget = null;
  
    // Check if the game has ended
    this.checkGameEnd();
  }

  checkGameEnd() {
    if (this.lifePoints <= 0) {
      this.duelResult = 'You lose!';
      alert(this.duelResult);
      this.router.navigate(['default']);
    } else if (this.opponentLifePoints <= 0) {
      this.duelResult = 'You win!';
      alert(this.duelResult);
      this.router.navigate(['default']);
    }
  }

  endTurn() {
    console.log('Ending turn. Current turn:', this.playerTurn ? 'Player' : 'Opponent');
  
    // Toggle the turn
    this.playerTurn = !this.playerTurn;
  
    // Reset selected cards and phase
    this.selectedCard = null;
    this.selectedTarget = null;
    this.phase = 'draw';
    this.hasSummonedThisTurn = false;
    this.hasAttackedThisTurn = false;
  
    console.log('Turn ended. Next turn:', this.playerTurn ? 'Player' : 'Opponent');
  
    // Draw a card for the current player
    this.drawCard();
  
    // If it's the opponent's turn, call the opponentTurn method
    if (!this.playerTurn) {
      console.log('Opponent\'s turn starts.');
      this.opponentTurn();
    } else {
      console.log('Player\'s turn starts.');
    }
  }

  nextPhase() {
    console.log('Current Phase:', this.phase);
  
    if (this.phase === 'draw') {
      this.phase = 'main';
    } else if (this.phase === 'main') {
      this.phase = 'battle';
    } else if (this.phase === 'battle') {
      this.phase = 'end';
      console.log('Ending turn...');
      this.endTurn();
    }
  
    console.log('Next Phase:', this.phase);
  }

  opponentTurn() {
    if (!this.playerTurn) {
      console.log('Opponent\'s turn.');
  
      // Opponent draws a card
      this.drawCard();
  
      // Opponent plays a random card from their hand if they have any
      if (this.opponentHand.length > 0 && this.opponentMonsterCards.length < 5) {
        const randomIndex = Math.floor(Math.random() * this.opponentHand.length);
        const cardToPlay = this.opponentHand[randomIndex];
  
        console.log('Opponent plays:', cardToPlay);
        this.opponentMonsterCards.push(cardToPlay);
  
        // Remove card from opponent's hand
        this.opponentHand = this.opponentHand.filter(c => c !== cardToPlay);
      } else if (this.opponentMonsterCards.length >= 5) {
        console.log('Opponent cannot summon more than 5 cards on the field!');
      }
  
      // Opponent attacks if they have monsters
      if (this.opponentMonsterCards.length > 0 && this.playerMonsterCards.length > 0) {
        console.log('Opponent is evaluating attack options...');
        console.log('Opponent\'s Monsters:', this.opponentMonsterCards);
        console.log('Player\'s Monsters:', this.playerMonsterCards);
  
        const attackingCard = this.opponentMonsterCards.find(card =>
          this.playerMonsterCards.some(playerCard => card.atk > playerCard.def)
        );
  
        if (attackingCard) {
          const targetCard = this.playerMonsterCards.find(playerCard => attackingCard.atk > playerCard.def);
  
          if (targetCard) {
            this.selectedCard = attackingCard;
            this.selectedTarget = targetCard;
  
            console.log('Opponent attacks with:', attackingCard, 'Targeting:', targetCard);
  
            // Add animation for the opponent's attack
            const attacker = document.querySelector(`[data-card-id="${attackingCard.id}"]`) as HTMLElement;
            const target = document.querySelector(`[data-card-id="${targetCard.id}"]`) as HTMLElement;
  
            if (attacker && target) {
              const attackerRect = attacker.getBoundingClientRect();
              const targetRect = target.getBoundingClientRect();
  
              const deltaX = targetRect.left - attackerRect.left;
              const deltaY = targetRect.top - attackerRect.top;
  
              const clonedElement = this.renderer.createElement('div');
              this.renderer.setStyle(clonedElement, 'position', 'fixed');
              this.renderer.setStyle(clonedElement, 'top', `${attackerRect.top}px`);
              this.renderer.setStyle(clonedElement, 'left', `${attackerRect.left}px`);
              this.renderer.setStyle(clonedElement, 'width', '120px');
              this.renderer.setStyle(clonedElement, 'height', '180px');
              this.renderer.setStyle(clonedElement, 'background-image', `url(${attackingCard.imageUrl})`);
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
                  console.log('Opponent attack animation completed.');
                  this.renderer.removeChild(document.body, clonedElement);
                  this.triggerExplosion(targetRect);
                  this.performAttack(); // Perform the attack after the animation
  
                  // End opponent's turn after the attack
                  setTimeout(() => {
                    console.log('Opponent\'s turn ends after attack.');
                    this.endTurn();
                  }, 1000);
                },
              });
            } else {
              console.log('Attacker or target card element not found.');
              this.endTurn(); // Ensure the turn ends even if animation fails
            }
            return;
          } else {
            console.log('No valid target found for attack.');
          }
        } else {
          console.log('No valid attacking card found.');
        } 
      } else {
        console.log('Opponent cannot attack. No monsters available.');
      }
  
      // If no valid attack is possible, end the turn
      console.log('Opponent cannot attack. Ending turn.');
      this.endTurn();
    } else {
      console.log('It is not the opponent\'s turn.');
    }
  }
}
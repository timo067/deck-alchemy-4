import { Component, OnInit } from '@angular/core';
import { CardService } from '../services/card.service';
import { PlayerDeckService } from '../services/playerdeck.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: false
})
export class GamePage implements OnInit {
  playerDeck: any = { name: 'Player Deck', cards: [] };
  enemyDeck: any = { name: 'Enemy Deck', cards: [] }; // Automatically created enemy deck
  selectedBackground: string = 'Blue Eyes White Dragon.jpg'; // Default background
  showPlayerDeck: boolean = false;
  playerStarts: boolean | null = null;
  searchTerm: string = '';
  searchResults: any[] = [];

  constructor(
    private cardService: CardService,
    private playerDeckService: PlayerDeckService,
    private router: Router
  ) {}

  ngOnInit() {
    const savedActiveDeck = localStorage.getItem('activeDeck');
    if (savedActiveDeck) {
      this.playerDeck = JSON.parse(savedActiveDeck); // Set the active deck as the player deck
      console.log('Active deck loaded for the game:', this.playerDeck);
    } else {
      alert('No active deck is set. Please select a deck in the Deck List page.');
    }
  
    this.initializeEnemyDeck();
    this.coinFlip();
  }

  async loadPlayerDeck() {
    try {
      this.playerDeck = await this.playerDeckService.getPlayerDeck();
      console.log('Player deck loaded:', this.playerDeck);

      // Save the player deck to localStorage for persistence
      localStorage.setItem('playerDeck', JSON.stringify(this.playerDeck));
    } catch (error) {
      console.error('Error loading player deck:', error);
      alert('Failed to load player deck. Please ensure you are logged in.');
    }
  }

  async initializeEnemyDeck() {
    try {
      const cards = await this.cardService.getCards().toPromise();
      const normalMonsters = cards.data.filter((card: any) => card.type === 'Normal Monster');
      this.enemyDeck.cards = this.getRandomCards(normalMonsters, 40); // Fill enemy deck with 40 random cards
      console.log('Enemy Deck initialized:', this.enemyDeck);

      // Save the enemy deck to localStorage for persistence
      localStorage.setItem('enemyDeck', JSON.stringify(this.enemyDeck));
    } catch (error) {
    }
  }

  restoreState() {
    // Restore player deck from localStorage
    const savedPlayerDeck = localStorage.getItem('playerDeck');
    if (savedPlayerDeck) {
      this.playerDeck = JSON.parse(savedPlayerDeck);
      console.log('Player deck restored from localStorage:', this.playerDeck);
    } else {
      this.loadPlayerDeck(); // Load from Firestore if not in localStorage
    }

    // Restore enemy deck from localStorage
    const savedEnemyDeck = localStorage.getItem('enemyDeck');
    if (savedEnemyDeck) {
      this.enemyDeck = JSON.parse(savedEnemyDeck);
      console.log('Enemy deck restored from localStorage:', this.enemyDeck);
    }

    // Restore background from localStorage
    const savedBackground = localStorage.getItem('selectedBackground');
    if (savedBackground) {
      this.selectedBackground = savedBackground;
      console.log('Background restored from localStorage:', this.selectedBackground);
    }
  }

  goToGamePage(deck: any): void {
    if (!deck || !deck.cards || deck.cards.length < 40) {
      alert('Please select a valid deck with at least 40 cards.');
      return;
    }
  
    this.router.navigate(['/game'], {
      state: { playerDeck: deck } // Pass the selected deck
    });
  }

  getRandomCards(cards: any[], count: number): any[] {
    const shuffled = cards.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  togglePlayerDeck() {
    this.showPlayerDeck = !this.showPlayerDeck;
  }

  coinFlip() {
    this.playerStarts = Math.random() < 0.5;
    console.log('Coin flip result - Player starts:', this.playerStarts);
  }

  changeBackground(backgroundImage: string) {
    this.selectedBackground = backgroundImage;

    // Save the selected background to localStorage for persistence
    localStorage.setItem('selectedBackground', this.selectedBackground);
    console.log('Background changed to:', this.selectedBackground);
  }

  deleteDeck(deckType: 'player' | 'enemy') {
    if (deckType === 'player') {
      this.playerDeck = { name: '', cards: [] }; // Reset the player deck
      localStorage.removeItem('playerDeck'); // Remove from localStorage
      alert('Player deck has been deleted.');
    } else if (deckType === 'enemy') {
      this.enemyDeck = { name: 'Enemy Deck', cards: [] }; // Reset the enemy deck
      localStorage.removeItem('enemyDeck'); // Remove from localStorage
      alert('Enemy deck has been deleted.');
    }
  }


  addCardToPlayerDeck(card: any) {
    const cardCount = this.playerDeck.cards.filter((c: any) => c.name === card.name).length;
    if (cardCount >= 3) {
      alert('You can only have up to 3 copies of the same card in your deck.');
      return;
    }

    if (this.playerDeck.cards.length < 40) {
      this.playerDeck.cards.push(card);
      console.log(`Card added to player deck: ${card.name}`);

      // Save the updated player deck to localStorage
      localStorage.setItem('playerDeck', JSON.stringify(this.playerDeck));
    } else {
      alert('Player deck is full!');
    }
  }

  async savePlayerDeck() {
    if (!this.playerDeck.name.trim()) {
      alert('Please enter a deck name.');
      return;
    }

    try {
      await this.playerDeckService.savePlayerDeck(this.playerDeck);
      alert('Player deck saved successfully!');

      // Save the player deck to localStorage for persistence
      localStorage.setItem('playerDeck', JSON.stringify(this.playerDeck));
    } catch (error) {
      console.error('Error saving player deck:', error);
      alert('Failed to save player deck.');
    }
  }

  navigateToDeckEditor() {
    this.router.navigate(['/deck-editor']);
  }

  navigateToCardSearch() {
    this.router.navigate(['/card-search']);
  }

  simulateDuel() {
    if (this.playerDeck.cards.length < 40) {
      alert('Player deck must have 40 cards.');
      return;
    }
  
    // Normalize player and enemy decks
    const normalizedPlayerDeck = this.playerDeck.cards.map((card: any) => this.normalizeCard(card));
    const normalizedEnemyDeck = this.enemyDeck.cards.map((card: any) => this.normalizeCard(card));
  
    // Navigate to the GameBoardPage
    this.router.navigate(['/game-board'], {
      state: {
        playerDeck: normalizedPlayerDeck, // Pass the normalized player deck
        enemyDeck: normalizedEnemyDeck,  // Pass the normalized enemy deck
        background: this.selectedBackground // Pass the selected background
      }
    });
  }
  
  // Add the normalizeCard method if it doesn't already exist in this file
  private normalizeCard(card: any): any {
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

  // Go to home page
  goHome(): void {
    this.router.navigate(['/default']);
  }
}
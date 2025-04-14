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
  playerDeck: any = { name: '', cards: [] };
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
    this.restoreState(); // Restore state from localStorage
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
      console.error('Error initializing enemy deck:', error);
      alert('Failed to initialize enemy deck.');
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

  searchCards() {
    if (this.searchTerm.trim() === '') {
      this.searchResults = []; // Clear the results if search term is empty
      return;
    }
  
    this.cardService.getCards().subscribe(
      (cards) => {
        if (cards) {
          // First, filter by "Normal Monster"
          const normalMonsters = cards.filter((card: any) => card.type === 'Normal Monster');
          
          // Then, filter the "Normal Monsters" by the search term (case-insensitive)
          this.searchResults = normalMonsters.filter((card: any) => 
            card.name.toLowerCase().includes(this.searchTerm.toLowerCase()) // Case insensitive search
          );
        } else {
          console.error('No cards data received');
        }
      },
      (error) => {
        console.error('Error fetching cards', error);
        alert('Failed to fetch cards. Please try again later.');
      }
    );
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
    
    // Navigate to the GameBoardPage
    this.router.navigate(['/game-board'], {
      state: {
        playerDeck: this.playerDeck.cards, // Pass the player deck
        enemyDeck: this.enemyDeck.cards,  // Pass the enemy deck
        background: this.selectedBackground // Pass the selected background
      }
    });
  }
}
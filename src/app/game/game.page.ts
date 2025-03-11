import { Component, OnInit } from '@angular/core';
import { CardService } from '../services/card.service';
import { PlayerDeckService } from '../services/playerdeck.service';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.page.html',
  styleUrls: ['./game.page.scss'],
  standalone: false
})
export class GamePage implements OnInit {
  enemyDecks: any[] = [];
  selectedEnemyDeck: any;
  playerDeck: any = { name: '', cards: [] };
  playerStarts: boolean | null = null;
  showPlayerDeck: boolean = false;
  showEnemyDeck: boolean = false;
  searchTerm: string = '';
  searchResults: any[] = [];
  private firestore: any;

  constructor(private cardService: CardService, private playerDeckService: PlayerDeckService, private router: Router) {
    const app = initializeApp(environment.firebase);
    this.firestore = getFirestore(app);
  }

  ngOnInit() {
    this.initializeEnemyDecks();
    this.loadPlayerDeck();
    this.coinFlip();
  }

  async loadPlayerDeck() {
    try {
      this.playerDeck = await this.playerDeckService.getPlayerDeck();
    } catch (error) {
      console.error('Error loading player deck:', error);
    }
  }

  async initializeEnemyDecks() {
    try {
      const cards = await this.cardService.getCards().toPromise();
      const normalMonsters = cards.data.filter((card: any) => card.type === 'Normal Monster');
      this.enemyDecks = [
        { name: 'Random Deck', cards: this.getRandomCards(normalMonsters, 40) }
      ];
      this.selectedEnemyDeck = this.enemyDecks[0];
    } catch (error) {
      console.error('Error initializing enemy decks:', error);
    }
  }

  getRandomCards(cards: any[], count: number): any[] {
    const shuffled = cards.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  generateDeck(...cards: string[]): any[] {
    // Generate a deck with 40 cards, repeating the provided cards
    const deck = [];
    while (deck.length < 40) {
      deck.push(...cards);
    }
    return deck.slice(0, 40);
  }

  coinFlip() {
    // Randomly decide who starts first
    this.playerStarts = Math.random() < 0.5;
  }

  togglePlayerDeck() {
    this.showPlayerDeck = !this.showPlayerDeck;
  }

  toggleEnemyDeck() {
    this.showEnemyDeck = !this.showEnemyDeck;
  }

  searchCards() {
    if (this.searchTerm.trim() === '') {
      this.searchResults = [];
      return;
    }

    this.cardService.getCards().subscribe(cards => {
      this.searchResults = cards.data.filter((card: any) => 
        card.type === 'Normal Monster' && card.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    });
  }

  addCardToPlayerDeck(card: any) {
    const cardCount = this.playerDeck.cards.filter((c: any) => c.name === card.name).length;
    if (cardCount >= 3) {
      alert('You can only have up to 3 copies of the same card in your deck.');
      return;
    }

    if (this.playerDeck.cards.length < 40) {
      this.playerDeck.cards.push(card);
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
    if (!this.selectedEnemyDeck) {
      alert('Please select an enemy deck.');
      return;
    }

    if (this.playerDeck.cards.length < 40) {
      alert('Player deck must have 40 cards.');
      return;
    }

    // Navigate to the GameBoardPage
    this.router.navigate(['/game-board'], {
      state: {
        playerDeck: this.playerDeck,
        enemyDeck: this.selectedEnemyDeck
      }
    });
  }
}
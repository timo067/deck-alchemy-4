import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DeckService } from '../services/deck.service';  // Import DeckService

interface Card {
  id: number;
  name: string;
  imageUrl: string;
}

interface Deck {
  name: string;
  cards: Card[];
}

@Component({
  selector: 'app-deck-editor',
  templateUrl: './deck-editor.page.html',
  styleUrls: ['./deck-editor.page.scss'],
  standalone: false
})
export class DeckEditorPage {
  decks: Deck[] = [];  // List of decks
  selectedDeck: Deck | null = null;  // Currently selected deck
  allCards: Card[] = [];  // Cards fetched from API
  searchTerm: string = '';  // Search term for card search
  loading: boolean = false;  // Loading state for API request
  error: string | null = null;  // Error message for card search
  errorMessage: string = '';  // Error message for adding cards
  newDeckName: string = '';  // New deck name input

  constructor(
    private http: HttpClient,
    private router: Router,
    private deckService: DeckService  // Inject DeckService
  ) {}

  // Create a new deck
  async createDeck(): Promise<void> {
    if (!this.newDeckName.trim()) {
      alert('Please enter a deck name.');
      return;
    }

    try {
      await this.deckService.createDeck(this.newDeckName);
      
      const newDeck = { name: this.newDeckName, cards: [] };
      this.decks.push(newDeck);
      this.selectedDeck = newDeck;
      this.newDeckName = '';  // Clear input
    } catch (error) {
      console.error('Error creating deck:', error);
      alert('Error creating deck.');
    }
  }

  // Select a deck and display its cards
  selectDeckFromList(deck: Deck): void {
    this.selectedDeck = deck;
  }

  // Getter to filter and show only selected deck's cards
  get filteredCards(): Card[] {
    if (!this.selectedDeck) return [];
    if (!this.searchTerm.trim()) return this.selectedDeck.cards;
    
    return this.selectedDeck.cards.filter(card =>
      card.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Search for cards
  searchCards(): void {
    if (!this.selectedDeck) {
      alert('Please select or create a deck first.');
      return;
    }

    if (!this.searchTerm.trim()) {
      this.error = 'Please enter a search term.';
      return;
    }

    this.loading = true;
    this.error = null;

    const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(this.searchTerm)}`;

    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.allCards = response.data.map((card: any) => ({
            id: card.id,
            name: card.name,
            imageUrl: card.card_images[0]?.image_url || 'https://via.placeholder.com/150',
          }));
        } else {
          this.allCards = [];
          this.error = 'No cards found.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'An error occurred while fetching cards.';
        console.error(err);
      },
    });
  }

  // Add card to deck (max 3 copies)
  addToDeck(card: Card): void {
    if (!this.selectedDeck) {
      alert('Please select a deck first.');
      return;
    }
  
    const cardCount = this.selectedDeck.cards.filter((c: Card) => c.id === card.id).length;
  
    if (cardCount < 3) {
      this.selectedDeck.cards.push(card);
      this.errorMessage = ''; 
      this.deckService.updateDeck(this.selectedDeck, card);  // Update Firestore
    } else {
      this.errorMessage = `You can only add "${card.name}" up to 3 times.`;
    }
  }
  
  // Remove card from deck
  removeFromDeck(card: Card): void {
    if (this.selectedDeck) {
      const index = this.selectedDeck.cards.findIndex((c: Card) => c.id === card.id);
      if (index !== -1) {
        this.selectedDeck.cards.splice(index, 1);
        this.deckService.updateDeck(this.selectedDeck, card, true);  // Update Firestore
      }
    }
  }

  // Delete deck
  async deleteDeck(deck: Deck): Promise<void> {
    const index = this.decks.indexOf(deck);
    if (index !== -1) {
      this.decks.splice(index, 1);

      if (this.selectedDeck === deck) {
        this.selectedDeck = null;
      }

      await this.deckService.deleteDeck(deck.name);
    }
  }

  // Navigate to other pages
  goHome(): void {
    this.router.navigate(['/default']);
  }

  goToCardSearch(): void {
    this.router.navigate(['/card-search']);
  }
}

import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IonButton, IonInput, IonList, IonItem, IonLabel, IonCard, IonCardContent, IonSpinner, IonCardHeader, IonCardTitle } from '@ionic/angular';  
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

  // Create a new deck and add it to the user's collection
  async createDeck(): Promise<void> {
    if (!this.newDeckName.trim()) {
      alert('Please enter a deck name.');
      return;
    }

    try {
      // Call createDeck on DeckService to save the deck to Firestore
      await this.deckService.createDeck(this.newDeckName);
      
      // Add the deck to the local list for UI
      this.decks.push({ name: this.newDeckName, cards: [] });
      this.selectedDeck = { name: this.newDeckName, cards: [] };
      this.newDeckName = '';  // Clear the input
    } catch (error) {
      console.error('Error creating deck:', error);
      alert('Error creating deck.');
    }
  }

  // Select a deck from the list and display its cards
  selectDeckFromList(deck: Deck): void {
    this.selectedDeck = deck;
    this.allCards = [];  // Reset cards when changing deck
  }

  // Search for cards based on the search term
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

    const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(
      this.searchTerm
    )}`;

    // Make the API request to search for cards
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

  // Add card to the selected deck, respecting the 3-card limit
  addToDeck(card: Card): void {
    if (!this.selectedDeck) {
      alert('Please select a deck first.');
      return;
    }
  
    const cardCount = this.selectedDeck.cards.filter((c: Card) => c.id === card.id).length;
  
    if (cardCount < 3) {
      this.selectedDeck.cards.push(card);
      this.errorMessage = ''; // Clear error message
  
      // Update the deck in Firestore
      this.deckService.updateDeck(this.selectedDeck, card);
    } else {
      this.errorMessage = `You can only add "${card.name}" up to 3 times.`;
    }
  }
  
  removeFromDeck(card: Card): void {
    if (this.selectedDeck) {
      const index = this.selectedDeck.cards.findIndex((c: Card) => c.id === card.id);
      if (index !== -1) {
        this.selectedDeck.cards.splice(index, 1); // Remove first occurrence
  
        // Update the deck in Firestore
        this.deckService.updateDeck(this.selectedDeck, card, true); // True indicates removal
      }
    }
  }

  // Delete the selected deck from the list
  async deleteDeck(deck: Deck): Promise<void> {
    const index = this.decks.indexOf(deck);
    if (index !== -1) {
      this.decks.splice(index, 1);

      // If the deleted deck was the selected one, clear the selection
      if (this.selectedDeck === deck) {
        this.selectedDeck = null;
        this.allCards = [];
      }

      // Delete the deck from Firestore
      await this.deckService.deleteDeck(deck.name);
    }
  }

  // Navigate to the home page
  goHome(): void {
    this.router.navigate(['/default']);
  }

  // Navigate to the card search page
  goToCardSearch(): void {
    this.router.navigate(['/card-search']);
  }
}

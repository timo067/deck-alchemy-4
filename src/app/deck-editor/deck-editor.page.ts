import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // Import Router
import { IonButton, IonInput, IonList, IonItem, IonLabel, IonCard, IonCardContent, IonSpinner, IonCardHeader, IonCardTitle } from '@ionic/angular';  // Import Ionic components

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
  templateUrl: './deck-editor.page.html',  // Updated path to page's HTML
  styleUrls: ['./deck-editor.page.scss'], // Updated path to page's SCSS
  standalone: false // Added standalone property
})
export class DeckEditorPage {
  decks: Deck[] = []; // Now Deck has a proper type
  selectedDeck: Deck | null = null; // This is either a Deck or null
  allCards: Card[] = []; // Cards fetched from API
  searchTerm: string = '';
  loading: boolean = false;
  error: string | null = null;
  errorMessage: string = '';
  newDeckName: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  // Create a new deck
  createDeck(): void {
    if (!this.newDeckName.trim()) {
      alert('Please enter a deck name.');
      return;
    }

    const newDeck: Deck = { name: this.newDeckName, cards: [] };
    this.decks.push(newDeck);
    this.selectedDeck = newDeck;
    this.newDeckName = '';
  }

  // Select a deck
  selectDeckFromList(deck: Deck): void {
    this.selectedDeck = deck;
    this.allCards = [];  // Reset cards when changing deck
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

    const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(
      this.searchTerm
    )}`;

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

  // Add card to the selected deck
  addToDeck(card: Card): void {
    if (!this.selectedDeck) {
      alert('Please select a deck first.');
      return;
    }
  
    const cardCount = this.selectedDeck.cards.filter((c: Card) => c.id === card.id).length;
  
    console.log('Selected Deck:', this.selectedDeck);
    console.log('Card to add:', card);
    console.log('Current card count in deck:', cardCount);
  
    if (cardCount < 3) {
      this.selectedDeck.cards.push(card);
      this.errorMessage = '';
      console.log('Card added to deck:', card);
    } else {
      this.errorMessage = `You can only add "${card.name}" up to 3 times.`;
      console.log('Card not added: limit reached');
    }
  }

  // Remove only one instance of the selected card from the deck
  removeFromDeck(card: Card): void {
    if (this.selectedDeck) {
      const index = this.selectedDeck.cards.findIndex((c: Card) => c.id === card.id);
      if (index !== -1) {
        this.selectedDeck.cards.splice(index, 1); // Remove only the first occurrence
      }
    }
  }

  // Delete deck
  deleteDeck(deck: Deck): void {
    const index = this.decks.indexOf(deck);
    if (index !== -1) {
      this.decks.splice(index, 1);
      
      // If the deleted deck was the selected one, clear the selection
      if (this.selectedDeck === deck) {
        this.selectedDeck = null;
        this.allCards = [];
      }
    }
  }

  // Go to home page
  goHome(): void {
    this.router.navigate(['/default']);
  }

  // Go to card search page
  goToCardSearch(): void {
    this.router.navigate(['/card-search']);
  }
}

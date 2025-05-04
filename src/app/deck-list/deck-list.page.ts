import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DeckService } from '../services/deck.service';

export interface Deck {
  id: string; // Unique identifier for the deck
  name: string;
  cards: any[];
}

@Component({
  selector: 'app-deck-list',
  templateUrl: './deck-list.page.html',
  styleUrls: ['./deck-list.page.scss'],
  standalone: false,
})
export class DeckListPage {
  decks: Deck[] = []; // List of decks
  newDeckName: string = ''; // New deck name input

  constructor(private router: Router, private deckService: DeckService) {}

  ngOnInit(): void {
    this.restoreState(); // Restore state on initialization
  }

  // Restore state from localStorage or Firestore
  restoreState(): void {
    const savedDecks = localStorage.getItem('decks');
    if (savedDecks) {
      this.decks = JSON.parse(savedDecks);
      console.log('Decks restored from localStorage:', this.decks);
    } else {
      this.loadDecks(); // Load from Firestore if not in localStorage
    }
  }

  // Load decks from the DeckService
  loadDecks(): void {
    this.deckService.getDecks().subscribe((decks) => {
      this.decks = decks.map((deck: any) => ({
        ...deck,
        id: deck.id || '' // Ensure each deck has an 'id' property
      }));
      console.log('Decks loaded from Firestore:', this.decks);

      // Save the decks to localStorage for persistence
      localStorage.setItem('decks', JSON.stringify(this.decks));
    });
  }

  // Save all decks to localStorage
  saveDecks(): void {
    localStorage.setItem('decks', JSON.stringify(this.decks));
    console.log('Decks saved to localStorage:', this.decks);
  }

  // Create a new deck
  createDeck(deckName: string): void {
    if (!deckName.trim()) {
      alert('Please enter a valid deck name.');
      return;
    }
  
    // Save the new deck to Firestore
    this.deckService.createDeck(deckName).then((docRef) => {
      const newDeck: Deck = {
        id: docRef.id, // Assign Firestore-generated ID
        name: deckName,
        cards: [],
      };
  
      this.decks.push(newDeck); // Add the new deck to the local list
      this.saveDecks(); // Save to localStorage
      console.log('New deck created and saved to Firestore:', newDeck);
      alert(`Deck "${deckName}" created successfully!`);
    }).catch((error) => {
      console.error('Failed to create deck:', error);
      alert('Failed to create the deck. Please try again.');
    });
  }

  // Navigate to the deck editor to edit an existing deck
  editDeck(deck: Deck): void {
    this.router.navigate(['/deck-editor'], { state: { deck } });
  }

  // Delete a deck
  deleteDeck(deck: any): void {
    if (!deck.id) {
      alert('Deck ID is missing. Cannot delete this deck.');
      return;
    }
  
    this.deckService.deleteDeck(deck.id).then(() => {
      // Remove the deck locally
      this.decks = this.decks.filter((d) => d.id !== deck.id);
      this.saveDecks(); // Save updated decks to localStorage
      console.log('Deck deleted:', deck);
      alert(`Deck "${deck.name}" has been deleted.`);
    }).catch((error) => {
      console.error('Failed to delete deck:', error);
      alert(error.message || 'Failed to delete the deck. Please try again.');
    });
  }

  setActiveDeck(deck: any): void {
    localStorage.setItem('activeDeck', JSON.stringify(deck)); // Save the active deck to localStorage
    alert(`Deck "${deck.name}" is now set as the active deck for the game.`);
  }

  // Navigate to other pages
  goHome(): void {
    this.router.navigate(['/default']);
  }

  goToCardSearch(): void {
    this.router.navigate(['/card-search']);
  }

  goToDeckEditor(): void {
    this.router.navigate(['/deck-editor']);
  }
}
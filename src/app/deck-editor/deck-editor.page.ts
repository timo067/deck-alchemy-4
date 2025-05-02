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

  ngOnInit(): void {
    this.restoreState(); // Restore state on initialization
  }
  
  // Restore state from localStorage or Firestore
  restoreState(): void {
    // Restore decks from localStorage
    const savedDecks = localStorage.getItem('decks');
    if (savedDecks) {
      this.decks = JSON.parse(savedDecks);
      console.log('Decks restored from localStorage:', this.decks);
    } else {
      this.loadDecks(); // Load from Firestore if not in localStorage
    }
  
    // Restore selected deck from localStorage
    const savedSelectedDeck = localStorage.getItem('selectedDeck');
    if (savedSelectedDeck) {
      this.selectedDeck = JSON.parse(savedSelectedDeck);
      console.log('Selected deck restored from localStorage:', this.selectedDeck);
    }
  }
  
  // Load decks from Firestore
  async loadDecks(): Promise<void> {
    try {
      const decks = await this.deckService.getDecks().toPromise();
      this.decks = decks || [];
      console.log('Decks loaded from Firestore:', this.decks);
  
      // Save the decks to localStorage for persistence
      localStorage.setItem('decks', JSON.stringify(this.decks));
    } catch (error) {
      console.error('Error loading decks:', error);
      alert('Failed to load decks. Please ensure you are logged in.');
    }
  }

    // Save the selected deck to localStorage
    saveSelectedDeck(): void {
      if (this.selectedDeck) {
        localStorage.setItem('selectedDeck', JSON.stringify(this.selectedDeck));
        console.log('Selected deck saved to localStorage:', this.selectedDeck);
      }
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

    // Check if a deck with the same name already exists
    const existingDeck = this.decks.find((deck) => deck.name.toLowerCase() === deckName.toLowerCase());
    if (existingDeck) {
      alert(`A deck with the name "${deckName}" already exists. Please choose a different name.`);
      return;
    }

    const newDeck: Deck = { name: deckName, cards: [] };
    this.decks.push(newDeck);
    this.saveDecks(); // Save to localStorage
    console.log('New deck created:', newDeck);
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
          this.saveSelectedDeck(); // Save the updated selected deck to localStorage
          this.saveDecks(); // Save all decks to localStorage
          this.deckService.updateDeck(this.selectedDeck, card); // Update Firestore
          console.log(`Card "${card.name}" added to deck "${this.selectedDeck.name}".`);
        } else {
          alert(`You can only add "${card.name}" up to 3 times.`);
        }
      }

  // Remove card from deck
  removeFromDeck(card: Card): void {
    if (this.selectedDeck) {
      const index = this.selectedDeck.cards.findIndex((c: Card) => c.id === card.id);
      if (index !== -1) {
        this.selectedDeck.cards.splice(index, 1);
        this.saveSelectedDeck(); // Save the updated selected deck to localStorage
        this.saveDecks(); // Save all decks to localStorage
        this.deckService.updateDeck(this.selectedDeck, card, true); // Update Firestore
        console.log(`Card "${card.name}" removed from deck "${this.selectedDeck.name}".`);
      }
    }
  }

    // Delete a deck
  deleteDeck(deck: Deck): void {
    this.decks = this.decks.filter((d) => d.name !== deck.name);
    this.saveDecks(); // Save to localStorage
    console.log('Deck deleted:', deck);
  }

  // Save changes to the selected deck
  saveDeck(): void {
    if (this.selectedDeck) {
      this.deckService.updateDeck(this.selectedDeck, null); // Update Firestore
      alert('Deck saved successfully!');
      this.router.navigate(['/deck-list']);
    }
  }

  // Navigate to other pages
  goHome(): void {
    this.router.navigate(['/default']);
  }

  goToCardSearch(): void {
    this.router.navigate(['/card-search']);
  }

  goToDeckList(): void {
    this.router.navigate(['/deck-list']);
  }
}
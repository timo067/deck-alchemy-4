import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';  // Import environment configuration
import { getFirestore, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, getDoc, collection } from 'firebase/firestore';
import { AuthService } from './auth.service';  // Import AuthService to get the user ID

@Injectable({
  providedIn: 'root',
})
export class DeckService {
  private firestore = getFirestore(initializeApp(environment.firebase));
  private selectedDecks: any[] = [];  // Array to store selected decks

  constructor(private authService: AuthService) {}

  // Method to get selected decks
  getSelectedDecks() {
    return this.selectedDecks;
  }

  // Method to set selected decks
  setSelectedDecks(decks: any[]) {
    this.selectedDecks = decks;
  }

  // Save player's deck to Firestore
  async saveDeck(deck: any): Promise<void> {
    try {
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User ID is missing. Please log in again.');
      }

      const deckRef = doc(collection(this.firestore, 'userDecks'), userId);
      await setDoc(deckRef, {
        userId: userId,
        name: deck.name,
        cards: deck.cards
      });

      console.log(`Deck "${deck.name}" saved successfully for user: ${userId}`);
    } catch (error) {
      console.error('Error saving deck:', error);
      throw new Error('Failed to save deck.');
    }
  }

  // Fetch player's deck from Firestore
  async getDeck(): Promise<any> {
    try {
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const deckRef = doc(this.firestore, 'userDecks', userId);
      const deckDoc = await getDoc(deckRef);

      if (deckDoc.exists()) {
        return deckDoc.data();
      } else {
        return { name: '', cards: [] };
      }
    } catch (error) {
      console.error('Error fetching deck:', error);
      throw new Error('Failed to fetch deck.');
    }
  }

  // Create a new deck for the authenticated user
  async createDeck(deckName: string): Promise<void> {
    try {
      if (!deckName.trim()) {
        throw new Error('Deck name cannot be empty.');
      }
  
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User ID is missing. Please log in again.');
      }
  
      const deckRef = doc(this.firestore, 'decks', deckName);
  
      await setDoc(deckRef, { 
        userId: userId, 
        name: deckName, 
        cards: []
      });
  
      console.log(`Deck "${deckName}" created successfully for user: ${userId}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error creating deck:', error.message);
        throw new Error('Failed to create deck. ' + error.message);
      } else {
        console.error('Unexpected error creating deck:', error);
        throw new Error('Failed to create deck due to an unknown error.');
      }
    }
  }

  // Delete a deck for the authenticated user
  async deleteDeck(deckName: string): Promise<void> {
    try {
      const userId = await this.authService.getUserId();  // Get user ID from AuthService
      const deckRef = doc(this.firestore, `decks`, deckName);  // Reference to the "decks" collection
      const deckDoc = await getDoc(deckRef);

      // Check if deck belongs to the authenticated user before deleting
      if (deckDoc.exists() && deckDoc.data()?.['userId'] === userId) {
        await deleteDoc(deckRef);  // Delete deck from Firestore
      } else {
        throw new Error('Deck does not belong to the authenticated user');
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw new Error('Failed to delete deck');
    }
  }  

  // Update deck by adding or removing cards
  async updateDeck(deck: any, card: any, remove = false): Promise<void> {
    const deckRef = doc(this.firestore, 'decks', deck.name);
  
    try {
      if (remove) {
        // Remove card from the deck
        await updateDoc(deckRef, {
          cards: arrayRemove(card),
        });
      } else {
        // Add card to the deck
        await updateDoc(deckRef, {
          cards: arrayUnion(card),
        });
      }
    } catch (error) {
      console.error('Error updating deck:', error);
      throw new Error('Failed to update deck.');
    }
  }

  // Fetch player's deck from Firestore
  async getPlayerDeck(): Promise<any> {
    try {
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const deckRef = doc(this.firestore, 'userDecks', userId);
      const deckDoc = await getDoc(deckRef);

      if (deckDoc.exists()) {
        return deckDoc.data();
      } else {
        return { name: '', cards: [] };
      }
    } catch (error) {
      console.error('Error fetching deck:', error);
      throw new Error('Failed to fetch deck.');
    }
  }

  // Fetch opponent's deck from Firestore
  async getOpponentDeck(): Promise<any> {
    try {
      const opponentDeckRef = doc(this.firestore, 'opponentDecks', 'randomOpponentDeck');
      const deckDoc = await getDoc(opponentDeckRef);

      if (deckDoc.exists()) {
        return deckDoc.data();
      } else {
        return { name: '', cards: [] };
      }
    } catch (error) {
      console.error('Error fetching opponent deck:', error);
      throw new Error('Failed to fetch opponent deck.');
    }
  }
}
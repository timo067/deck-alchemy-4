import { Injectable } from '@angular/core';
import { getFirestore, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';  // Import AuthService to get the user ID

@Injectable({
  providedIn: 'root',
})
export class DeckService {
  private firestore = getFirestore();

  constructor(private authService: AuthService) {}

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
    const deckRef = doc(this.firestore, `decks`, deck.name);  // Reference to the "decks" collection

    if (remove) {
      // Remove the card from the deck
      await updateDoc(deckRef, {
        cards: arrayRemove(card),  // Remove card using arrayRemove
      });
    } else {
      // Add the card to the deck
      await updateDoc(deckRef, {
        cards: arrayUnion(card),  // Add card using arrayUnion
      });
    }
  }
}

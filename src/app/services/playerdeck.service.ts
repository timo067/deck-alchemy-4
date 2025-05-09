import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { environment } from '../../environments/environment';  // Import environment configuration
import { AuthService } from './auth.service';  // Import AuthService to get the user ID and email

@Injectable({
  providedIn: 'root',
})
export class PlayerDeckService {
  private firestore = getFirestore(initializeApp(environment.firebase));

  constructor(private authService: AuthService) {}

  // Save player's deck to Firestore
  async savePlayerDeck(deck: any): Promise<void> {
    try {
      const userId = await this.authService.getUserId();
      const userEmail = await this.authService.getUserEmail();
      if (!userId || !userEmail) {
        throw new Error('User ID or email is missing. Please log in again.');
      }

      const deckRef = doc(collection(this.firestore, 'userDecks'), userId);
      await setDoc(deckRef, {
        userId: userId,
        email: userEmail,
        name: deck.name,
        cards: deck.cards
      });

      console.log(`Player deck "${deck.name}" saved successfully for user: ${userId}`);
    } catch (error) {
      console.error('Error saving player deck:', error);
      throw new Error('Failed to save player deck.');
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
      console.error('Error fetching player deck:', error);

      // Add more context to the error message
      throw new Error('Failed to fetch player deck. Please ensure you are logged in.');
    }
  }

  // Save duel history to Firestore
  async saveDuelHistory(duelHistory: any[]): Promise<void> {
    try {
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User ID is missing. Please log in again.');
      }

      const historyRef = doc(collection(this.firestore, 'userDecks'), userId);
      await setDoc(historyRef, { duelHistory });

      console.log(`Duel history saved successfully for user: ${userId}`);
    } catch (error) {
      console.error('Error saving duel history:', error);
      throw new Error('Failed to save duel history.');
    }
  }

  // Fetch duel history from Firestore
  async getDuelHistory(): Promise<any[]> {
    try {
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const historyRef = doc(this.firestore, 'userDecks', userId);
      const historyDoc = await getDoc(historyRef);

      if (historyDoc.exists()) {
        return historyDoc.data()['duelHistory'] || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching duel history:', error);
      throw new Error('Failed to fetch duel history. Please ensure you are logged in.');
    }
  }
}
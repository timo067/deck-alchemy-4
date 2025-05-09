import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { environment } from '../../environments/environment'; // Import environment configuration
import { AuthService } from './auth.service'; // Import AuthService to get the user ID

@Injectable({
  providedIn: 'root',
})
export class DuelHistoryService {
  private firestore = getFirestore(initializeApp(environment.firebase));

  constructor(private authService: AuthService) {}

  // Save duel history to Firestore
      async saveDuelResult(duelResult: { result: string; date: Date }): Promise<void> {
  try {
    const userId = await this.authService.getUserId(); // Get the authenticated user's ID
    console.log('Saving duel result for user ID:', userId); // Debugging
    if (!userId) {
      throw new Error('User ID is missing. Please log in again.');
    }

    const historyRef = doc(this.firestore, 'duelHistory', userId); // Reference to the user's duel history document
    const historyDoc = await getDoc(historyRef);

    let duelHistory = [];
    if (historyDoc.exists()) {
      duelHistory = historyDoc.data()['duelHistory'] || [];
    }

    // Add the new duel result to the history
    duelHistory.push(duelResult);

    // Keep only the last 5 duels
    if (duelHistory.length > 5) {
      duelHistory = duelHistory.slice(-5);
    }

    // Save the updated duel history back to Firestore
    await setDoc(historyRef, { duelHistory }, { merge: true }); // Use merge to avoid overwriting
    console.log(`Duel history updated successfully for user: ${userId}`);
  } catch (error) {
    console.error('Error saving duel history:', error);
    throw new Error('Failed to save duel history.');
  }
}

  // Fetch duel history from Firestore
  async getDuelHistory(): Promise<{ result: string; date: Date }[]> {
    try {
      const userId = await this.authService.getUserId(); // Get the authenticated user's ID
      console.log('Fetching duel history for user ID:', userId); // Debugging
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const historyRef = doc(this.firestore, 'duelHistory', userId); // Reference to the user's duel history document
      const historyDoc = await getDoc(historyRef);

      if (historyDoc.exists()) {
        const duelHistory = historyDoc.data()['duelHistory'] || [];
        console.log('Fetched Duel History:', duelHistory); // Debugging
        return duelHistory;
      } else {
        console.warn(`No duel history found for user: ${userId}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching duel history:', error);
      throw new Error('Failed to fetch duel history. Please ensure you are logged in.');
    }
  }
}
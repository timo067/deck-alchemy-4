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

  // Save a duel result to Firestore
  async saveDuelResult(duelResult: { result: string; date: Date }): Promise<void> {
  try {
    const userId = await this.authService.getUserId();
    console.log('Saving duel result for user ID:', userId); // Debugging
    if (!userId) {
      throw new Error('User ID is missing. Please log in again.');
    }

    const historyRef = doc(this.firestore, 'duelHistory', userId);
    console.log('Firestore document reference:', historyRef); // Debugging

    const historyDoc = await getDoc(historyRef);
    console.log('Existing duel history document:', historyDoc.data()); // Debugging

    let duelHistory = [];
    if (historyDoc.exists()) {
      duelHistory = historyDoc.data()['duelHistory'] || [];
    }

    duelHistory.push(duelResult);

    if (duelHistory.length > 5) {
      duelHistory = duelHistory.slice(-5);
    }

    await setDoc(historyRef, { duelHistory }, { merge: true });
    console.log('Duel history saved successfully:', duelHistory); // Debugging
  } catch (error) {
    console.error('Error saving duel history:', error);
    throw new Error('Failed to save duel history.');
  }
}

  // Fetch duel history from Firestore
  async getDuelHistory(): Promise<{ result: string; date: Date }[]> {
    try {
      const userId = await this.authService.getUserId(); // Get the authenticated user's ID
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const historyRef = doc(this.firestore, 'duelHistory', userId); // Reference to the user's duel history document
      const historyDoc = await getDoc(historyRef);

      if (historyDoc.exists()) {
        const duelHistory = historyDoc.data()['duelHistory'] || [];
        // Convert Firestore Timestamps to JavaScript Dates
        const convertedHistory = duelHistory.map((record: any) => ({
          result: record.result,
          date: record.date.toDate ? record.date.toDate() : record.date, // Convert Firestore Timestamp to Date
        }));
        console.log('Fetched Duel History:', convertedHistory);
        return convertedHistory;
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
import { Injectable } from '@angular/core';
import { getFirestore, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, getDocs, collection, getDoc } from 'firebase/firestore';
import { AuthService } from './auth.service'; // Import AuthService to get the user ID
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeckService {
  private firestore = getFirestore();
  private decksSubject: BehaviorSubject<{ name: string; cards: any[] }[]> = new BehaviorSubject<{ name: string; cards: any[] }[]>([]);

  constructor(private authService: AuthService) {
    this.loadDecks(); // Automatically load decks on service initialization
  }
  
  // Fetch all decks for the authenticated user
  async loadDecks(): Promise<void> {
    try {
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User ID is missing. Please log in again.');
      }

      const decksCollection = collection(this.firestore, 'decks');
      const querySnapshot = await getDocs(decksCollection);

      const userDecks: { name: string; cards: any[] }[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data['userId'] === userId) {
          userDecks.push({ name: data['name'], cards: data['cards'] || [] });
        }
      });

      this.decksSubject.next(userDecks); // Update the BehaviorSubject with the fetched decks
    } catch (error) {
      console.error('Error fetching decks:', error);
      throw new Error('Failed to fetch decks.');
    }
  }

  // Get all decks as an observable
  getDecks(): Observable<{ name: string; cards: any[] }[]> {
    const decksCollection = collection(this.firestore, 'decks');
    return new Observable((observer) => {
      getDocs(decksCollection).then((querySnapshot) => {
        const decks = querySnapshot.docs.map((doc) => doc.data() as { name: string; cards: any[] });
        observer.next(decks);
        observer.complete();
      }).catch((error) => {
        observer.error(error);
      });
    });
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
        cards: [],
      });

      // Add the new deck to the BehaviorSubject
      const currentDecks = this.decksSubject.value;
      this.decksSubject.next([...currentDecks, { name: deckName, cards: [] }]);

      console.log(`Deck "${deckName}" created successfully for user: ${userId}`);
    } catch (error) {
      console.error('Error creating deck:', error);
      throw new Error('Failed to create deck.');
    }
  }

  // Delete a deck for the authenticated user
  async deleteDeck(deckId: string): Promise<void> {
    try {
      if (!deckId) {
        throw new Error('Deck ID is undefined.');
      }
  
      const deckRef = doc(this.firestore, 'decks', deckId); // Reference to the deck in Firestore
      await deleteDoc(deckRef); // Delete the deck from Firestore
      console.log(`Deck with ID "${deckId}" deleted successfully.`);
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw new Error('Failed to delete deck.');
    }
  }
  

  // Update deck by adding or removing cards
  async updateDeck(deck: any, card: any | null, isRemove: boolean = false): Promise<void> {
    try {
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User is not authenticated.');
      }
  
      const deckRef = doc(this.firestore, 'decks', deck.name); // Reference to the deck in Firestore
      const deckDoc = await getDoc(deckRef);
  
      if (deckDoc.exists()) {
        const updatedDeck = { ...deckDoc.data(), cards: deck.cards };
        await setDoc(deckRef, updatedDeck); // Update the deck in Firestore
        console.log(`Deck "${deck.name}" updated in Firestore.`);
      } else {
        throw new Error('Deck does not exist in Firestore.');
      }
    } catch (error) {
      console.error('Error updating deck:', error);
    }
  }
}
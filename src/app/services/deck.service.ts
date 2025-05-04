import { Injectable } from '@angular/core';
import { getFirestore, doc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, getDocs, collection, getDoc, addDoc } from 'firebase/firestore';
import { AuthService } from './auth.service'; // Import AuthService to get the user ID
import { BehaviorSubject, Observable } from 'rxjs';
import { Deck } from '../deck-list/deck-list.page';

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
  
      const userDecks: { id: string; name: string; cards: any[] }[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data['userId'] === userId) {
          userDecks.push({
            id: doc.id, // Include the Firestore document ID
            name: data['name'],
            cards: data['cards'] || [],
          });
        }
      });
  
      this.decksSubject.next(userDecks); // Update the BehaviorSubject with the fetched decks
    } catch (error) {
      console.error('Error fetching decks:', error);
      throw new Error('Failed to fetch decks.');
    }
  }

  // Get all decks as an observable
  getDecks(): Observable<Deck[]> {
    return new Observable((observer) => {
      const userId = this.authService.getUserId();
      if (!userId) {
        observer.error('User is not authenticated.');
        return;
      }
  
      const decksCollection = collection(this.firestore, 'decks');
      getDocs(decksCollection).then((querySnapshot) => {
        const userDecks: Deck[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data['userId'] === userId) {
            userDecks.push({
              id: doc.id,
              name: data['name'],
              cards: data['cards'] || [],
            });
          }
        });
        observer.next(userDecks);
        observer.complete();
      }).catch((error) => {
        observer.error(error);
      });
    });
  }

  // Create a new deck for the authenticated user
  async createDeck(deckName: string): Promise<any> {
    try {
      if (!deckName.trim()) {
        throw new Error('Deck name cannot be empty.');
      }
  
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User ID is missing. Please log in again.');
      }
  
      const decksCollection = collection(this.firestore, 'decks');
      const newDeck = {
        userId: userId,
        name: deckName,
        cards: [],
      };
  
      // Add the new deck to Firestore and return the document reference
      const docRef = await addDoc(decksCollection, newDeck);
      console.log(`Deck "${deckName}" created successfully with ID: ${docRef.id}`);
      return docRef; // Return the document reference
    } catch (error) {
      console.error('Error creating deck:', error);
      throw new Error('Failed to create deck.');
    }
  }

  // Delete a deck for the authenticated user
  async deleteDeck(deckId: string): Promise<void> {
    const userId = await this.authService.getUserId();
    if (!userId) {
      throw new Error('User is not authenticated.');
    }
  
    const deckRef = doc(this.firestore, 'decks', deckId);
    await deleteDoc(deckRef);
    console.log(`Deck with ID "${deckId}" deleted successfully.`);
  }
  

  // Update deck by adding or removing cards
  async updateDeck(deck: any, card: any | null, isRemove: boolean = false): Promise<void> {
    try {
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User is not authenticated.');
      }
  
      const deckRef = doc(this.firestore, 'decks', deck.id); // Use deck.id instead of deck.name
  
      if (isRemove && card) {
        console.log('Removing card from deck:', card);
        await updateDoc(deckRef, {
          cards: arrayRemove(card),
        });
      } else if (card) {
        console.log('Adding card to deck:', card);
        await updateDoc(deckRef, {
          cards: arrayUnion(card), // Ensure the full card object is passed here
        });
      } else {
        console.log('Updating entire deck:', deck);
        await setDoc(deckRef, {
          ...deck,
          userId: userId,
        }, { merge: true }); // Use merge to avoid overwriting
      }
  
      console.log(`Deck "${deck.name}" updated successfully.`);
    } catch (error) {
      console.error('Error updating deck:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update deck: ${errorMessage}`);
    }
  }

  async migrateOldDecksToFirestore(decks: Deck[]): Promise<void> {
    try {
      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User is not authenticated.');
      }
  
      const decksCollection = collection(this.firestore, 'decks');
  
      for (const deck of decks) {
        if (!deck.id) {
          // Save the deck to Firestore
          const newDeck = {
            userId: userId,
            name: deck.name,
            cards: deck.cards || [],
          };
  
          const docRef = await addDoc(decksCollection, newDeck);
          deck.id = docRef.id; // Assign the Firestore-generated ID to the deck
          console.log(`Migrated deck "${deck.name}" to Firestore with ID: ${docRef.id}`);
        }
      }
    } catch (error) {
      console.error('Error migrating old decks to Firestore:', error);
      throw new Error('Failed to migrate old decks to Firestore.');
    }
  }

  
}
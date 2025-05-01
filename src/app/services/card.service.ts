import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment'; // Import Firebase environment configuration

@Injectable({
  providedIn: 'root'
})
export class CardService {

  private apiUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'; // API URL for fetching card data
  private firestore = getFirestore(initializeApp(environment.firebase)); // Initialize Firestore

  constructor(private http: HttpClient) {}

  // Fetch all cards from the API
  getCards(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => response.data), // Extract the 'data' field from the API response
      catchError(this.handleError) // Handle errors if the request fails
    );
  }

  // Filter and return only monster cards
  getNormalMonsters(cards: any[] | undefined | null): any[] {
    if (!cards) {
      return []; // Return an empty array if cards is undefined or null
    }
    // Filter cards to include any type of monster and normalize them
    return cards
      .filter(card => card.type && card.type.includes('Monster'))
      .map(card => this.normalizeCard(card));
  }

  // Normalize a card to ensure all required properties are present
  private normalizeCard(card: any): any {
    return {
      id: card.id || null,
      name: card.name || 'Unknown Card',
      imageUrl: card.imageUrl || (card.card_images?.[0]?.image_url || 'assets/images/default-card.jpg'),
      atk: card.atk || 0,
      def: card.def || 0,
      attribute: card.attribute || 'Unknown',
      archetype: card.archetype || 'None',
      race: card.race || 'Unknown',
      type: card.type || 'Unknown',
      level: card.level || 0,
      desc: card.desc || 'No description available.',
      isBoosted: card.isBoosted || false,
      card_images: card.card_images || [{ image_url: 'assets/images/default-card.jpg' }],
      card_prices: card.card_prices || [],
      card_sets: card.card_sets || [],
      frameType: card.frameType || 'Unknown',
      humanReadableCardType: card.humanReadableCardType || 'Unknown',
      typeline: card.typeline || [],
      ygoprodeck_url: card.ygoprodeck_url || ''
    };
  }

  // Save a deck to Firestore
  async saveDeckToFirestore(deckName: string, userId: string, cards: any[]): Promise<void> {
    try {
      const normalizedCards = cards.map(card => this.normalizeCard(card));
      const deckRef = doc(collection(this.firestore, 'decks'), deckName); // Use deckName as the document ID
      await setDoc(deckRef, {
        name: deckName,
        userId: userId,
        cards: normalizedCards
      });
      console.log(`Deck "${deckName}" saved successfully.`);
    } catch (error) {
      console.error('Error saving deck to Firestore:', error);
      throw new Error('Failed to save deck to Firestore.');
    }
  }

  // Fetch a deck from Firestore
  async getDeckFromFirestore(deckName: string): Promise<any> {
    try {
      const deckRef = doc(this.firestore, 'decks', deckName);
      const deckDoc = await getDoc(deckRef);

      if (deckDoc.exists()) {
        const data = deckDoc.data();
        console.log(`Deck "${deckName}" fetched successfully:`, data);
        return data;
      } else {
        console.warn(`Deck "${deckName}" does not exist.`);
        return null;
      }
    } catch (error) {
      console.error('Error fetching deck from Firestore:', error);
      throw new Error('Failed to fetch deck from Firestore.');
    }
  }

  // Handle errors from the API request
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage); // Log the error to the console for debugging
    return throwError(errorMessage); // Throw the error so it can be handled in the component
  }
}
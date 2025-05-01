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
  
      const normalizedCards = deck.cards.map((card: any) => this.normalizeCard(card));
  
      const deckRef = doc(collection(this.firestore, 'userDecks'), userId);
      await setDoc(deckRef, {
        userId: userId,
        email: userEmail,
        name: deck.name,
        cards: normalizedCards
      });
  
      console.log(`Player deck "${deck.name}" saved successfully for user: ${userId}`);
    } catch (error) {
      console.error('Error saving player deck:', error);
      throw new Error('Failed to save player deck.');
    }
  }
  
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
        const data = deckDoc.data();
        // Normalize the cards fetched from Firestore
        const normalizedCards = (data['cards'] || []).map((card: any) => this.normalizeCard(card));
        console.log('Normalized Player Deck:', normalizedCards); // Debug log to verify normalization
        return { ...data, cards: normalizedCards };
      } else {
        return { name: '', cards: [] };
      }
    } catch (error) {
      console.error('Error fetching player deck:', error);
      throw new Error('Failed to fetch player deck. Please ensure you are logged in.');
    }
  }
}
import { Component, OnInit } from '@angular/core';
import { CardService } from '../services/card.service';  // Assuming you have a service for fetching cards

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.page.html',
  styleUrls: ['./game-board.page.scss'],
  standalone: false
})
export class GameBoardPage implements OnInit {
  // Add default background image
  background: string = 'Blue Eyes White Dragon.jpg';  // Default background image

  // Game-related properties
  lifePoints: number = 4000;
  opponentLifePoints: number = 4000;
  playerTurn: boolean = true;
  phase: string = 'draw';
  selectedCard: any = null;
  selectedTarget: any = null;

  playerHand: any[] = [];
  opponentHand: any[] = [];
  playerMonsterCards: any[] = [];
  opponentMonsterCards: any[] = [];

  constructor(private cardService: CardService) {}

  ngOnInit() {
    // Initialize the game, fetch cards, etc.
    this.cardService.getCards().subscribe(cards => {
      this.playerHand = this.drawCards(cards, 5);
      this.opponentHand = this.drawCards(cards, 5);
    });
  }

  // Function to change background
  changeBackground(backgroundImage: string) {
    this.background = backgroundImage;  // Update background image
  }

  // Function to draw cards (customize this based on your actual card logic)
  drawCards(deck: any[], count: number): any[] {
    return deck.slice(0, count);  // Simple example, adjust as needed
  }

  // Attack function (Placeholder logic)
  attack() {
    if (this.selectedCard && this.selectedTarget) {
      // Example attack logic
      console.log(`Attacking ${this.selectedTarget.name} with ${this.selectedCard.name}`);
      this.selectedCard = null;  // Clear selected card after attack
      this.selectedTarget = null;  // Clear selected target after attack
    }
  }

  // Select a card from the player's field
  selectCard(card: any) {
    this.selectedCard = card;
  }

  // Select a target from the opponent's field
  selectTarget(card: any) {
    this.selectedTarget = card;
  }

  // Play card function (Customize as per your game mechanics)
  playCard(card: any) {
    console.log(`Playing card: ${card.name}`);
    // Additional logic to play the card can be added here
  }

  // Move to next phase (placeholder)
  nextPhase() {
    this.phase = this.phase === 'draw' ? 'main' : 'draw';
  }

  // Reset game function (reset all states)
  resetGame() {
    this.lifePoints = 4000;
    this.opponentLifePoints = 4000;
    this.playerTurn = true;
    this.phase = 'draw';
    this.selectedCard = null;
    this.selectedTarget = null;
    this.playerHand = [];
    this.opponentHand = [];
    this.playerMonsterCards = [];
    this.opponentMonsterCards = [];
  }
}

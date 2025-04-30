import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // Import Router
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCol, IonGrid, IonItem, IonInput, IonRow, IonText, IonSpinner } from '@ionic/angular';

interface Card {
  id: number;
  name: string;
  imageUrl: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  linkval?: number;
  scale?: number;
  archetype?: string;
  showDetails?: boolean; // New property to track toggle state
}

@Component({
  selector: 'app-card-search',
  templateUrl: './card-search.page.html',
  styleUrls: ['./card-search.page.scss'],
  standalone: false
})
export class CardSearchPage {
  allCards: Card[] = [];
  filteredCards: Card[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: string | null = null;
  showFilters: boolean = false; // Property to toggle filter visibility
  filters = {
    atk: null as number | null,
    def: null as number | null,
    level: null as number | null,
    type: '',
    race: '',
    archetype: ''
  };

  constructor(private http: HttpClient, private router: Router) {}

  toggleFilters(): void {
    this.showFilters = !this.showFilters; // Toggle the visibility of the filter section
  }

  searchCards(): void {
    if (!this.searchTerm.trim()) {
      this.error = 'Please enter a search term.';
      return;
    }

    this.loading = true;
    this.error = null;

    const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(this.searchTerm)}`;

    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.allCards = response.data.map((card: any) => ({
            id: card.id,
            name: card.name,
            imageUrl: card.card_images[0]?.image_url || 'https://via.placeholder.com/150',
            type: card.type,
            desc: card.desc,
            atk: card.atk,
            def: card.def,
            level: card.level,
            race: card.race,
            scale: card.scale,
            archetype: card.archetype,
            showDetails: false, // Initialize showDetails as false
          }));
          this.applyFilters();
        } else {
          this.allCards = [];
          this.error = 'No cards found.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'An error occurred while fetching cards.';
        console.error(err);
      },
    });
  }

  applyFilters(): void {
    this.filteredCards = this.allCards.filter(card => 
      (this.filters.atk === null || (card.atk && card.atk >= this.filters.atk)) &&
      (this.filters.def === null || (card.def && card.def >= this.filters.def)) &&
      (this.filters.level === null || (card.level && card.level === this.filters.level)) &&
      (this.filters.type === '' || card.type.toLowerCase().includes(this.filters.type.toLowerCase())) &&
      (this.filters.race === '' || card.race.toLowerCase().includes(this.filters.race.toLowerCase())) &&
      (this.filters.archetype === '' || (card.archetype && card.archetype.toLowerCase().includes(this.filters.archetype.toLowerCase()))));
  }

  resetFilters(): void {
    this.filters = {
      atk: null,
      def: null,
      level: null,
      type: '',
      race: '',
      archetype: ''
    };
    this.applyFilters();
  }

  toggleCardDetails(card: Card): void {
    card.showDetails = !card.showDetails;
  }

  // Go to home page
  goHome(): void {
    this.router.navigate(['/default']);
  }

  // Go to card search page
  goToDeckEditor(): void {
    this.router.navigate(['/deck-editor']);
  }
}

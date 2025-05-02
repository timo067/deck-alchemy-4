import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  private apiUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'; // Replace with your actual API URL

  constructor(private http: HttpClient) {}

  // Get cards from the API
  getCards(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => response.data), // Map to get the 'data' field from the response
      catchError(this.handleError) // Handle errors if the request fails
    );
  }

  // Filter cards to get only 'Normal Monster' type
  getNormalMonsters(cards: any[] | undefined | null): any[] {
    if (!cards) {
      return []; // Return an empty array if cards is undefined or null
    }
    return cards.filter(card => card.type === 'Normal Monster');
  }

  // Handle errors from the API request
  private handleError(error: any) {
    let errorMessage = 'Unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage); // Log to console for debugging
    return throwError(errorMessage); // Throw error so we can handle it in the component
  }
}
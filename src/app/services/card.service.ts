import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  private apiUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'; // Replace with your actual API URL

  constructor(private http: HttpClient) {}

  getCards(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}

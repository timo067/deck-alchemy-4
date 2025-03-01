import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-default',
  templateUrl: './default.page.html',
  styleUrls: ['./default.page.scss'],
  standalone: false
})
export class DefaultPage implements OnInit {   // Implement OnInit
  loggedInAccounts: string[] = [];

  constructor(private router: Router, private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {   // Call the function inside ngOnInit
    this.loadLoggedInAccounts();
  }

  loadLoggedInAccounts(): void {
    this.loggedInAccounts = this.authService.getLoggedInAccounts();
    this.cdr.detectChanges();  // Ensure view gets updated
  }

  navigateToDeckEditor(): void {
    this.router.navigate(['/deck-editor']);
  }

  navigateToSimilarGame(): void {
    this.router.navigate(['/similar-game']);
  }

  navigateToCardSearch(): void {
    this.router.navigate(['/card-search']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}

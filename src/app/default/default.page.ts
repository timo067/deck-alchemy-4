import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-default',
  templateUrl: './default.page.html',
  styleUrls: ['./default.page.scss'],
  standalone: false,
})
export class DefaultPage implements OnInit {
  loggedInAccounts: string[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.loggedInAccounts = this.authService.getLoggedInAccounts();
    this.restoreLoggedInAccounts();
  }

      // Restore logged-in accounts from localStorage
  restoreLoggedInAccounts(): void {
    this.loggedInAccounts = this.authService.getLoggedInAccounts();
    console.log('Logged-in accounts restored:', this.loggedInAccounts);
  }

  // Add a new account (for demonstration purposes)
  addAccount(account: string): void {
    this.loggedInAccounts.push(account);
    this.saveLoggedInAccounts(); // Save to localStorage
  }

  // Save logged-in accounts to localStorage
  saveLoggedInAccounts(): void {
    localStorage.setItem('loggedInAccounts', JSON.stringify(this.loggedInAccounts));
    console.log('Logged-in accounts saved:', this.loggedInAccounts);
  }

  navigateToDeckList() {
    this.router.navigate(['/deck-list']);
  }

  navigateToSimilarGame() {
    this.router.navigate(['/game']);
  }

  navigateToCardSearch() {
    this.router.navigate(['/card-search']);
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    }).catch(error => {
      console.error('Logout failed', error);
    });
  }
}
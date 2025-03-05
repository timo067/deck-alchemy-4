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
  }

  navigateToDeckEditor() {
    this.router.navigate(['/deck-editor']);
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
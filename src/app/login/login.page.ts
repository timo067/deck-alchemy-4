// login.page.ts
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { getFirestore, doc, updateDoc, serverTimestamp, collection, getDocs, query, where, addDoc } from 'firebase/firestore';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone:false
})
export class LoginPage {
  email: string;
  password: string;

  private firestore = getFirestore(); // Firestore instance

  constructor(private authService: AuthService, private router: Router) {
    this.email = ''; // Initialize email
    this.password = ''; // Initialize password
  }

  async login() {
    try {
      const userCredential = await this.authService.login(this.email, this.password);

      if (userCredential.user) {
        const userId = userCredential.user.uid;

        // Update last login and check/reset spendings
        await this.updateLastLogin(userId);

        // Navigate to the home page after login
        this.router.navigate(['/card-search']);
      } else {
        console.error('Login failed: No user returned.');
      }
    } catch (error) {
      console.error('Login failed', error);
      // Display an error message to the user
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'Users', userId);
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
      });
      console.log('Last login timestamp updated successfully.');
    } catch (error) {
      console.error('Error updating last login timestamp:', error);
    }
  }
}
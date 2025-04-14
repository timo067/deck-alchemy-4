import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email: string;
  password: string;
  private firestore = getFirestore();
  username: string | undefined;

  constructor(private authService: AuthService, private router: Router) {
    this.email = '';
    this.password = '';
    this.username = '';
  }

  async login() {
    console.log('Login method triggered');  // Log to check if method is called
  
    try {
      const userCredential = await this.authService.login(this.email, this.password);
      console.log('User Credential:', userCredential);  // Log the returned userCredential
  
      if (userCredential.user) {
        const userId = userCredential.user.uid;

        // Store the token in localStorage
        const token = await userCredential.user.getIdToken();
        localStorage.setItem('authToken', token);
        console.log('Auth token stored in localStorage.');

        // Update last login timestamp
        await this.updateLastLogin(userId);
  
        // Fetch and store the username in AuthService
        const username = await this.authService.getUsername();
        if (username) {
          this.authService.addLoggedInUser(username);
          this.router.navigate(['/default']);
        } else {
          console.warn('Username not found in Firestore.');
        }
  
      } else {
        console.error('Login failed: No user returned.');
      }
    } catch (error) {
      console.error('Login failed', error);
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
      });
      console.log('Last login timestamp updated successfully.');
    } catch (error) {
      console.error('Error updating last login timestamp:', error);
    }
  }
}
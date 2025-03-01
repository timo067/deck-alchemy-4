import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  username: string = ''; // Added username field
  email: string = ''; 
  password: string = ''; 
  private firestore = getFirestore(); 

  constructor(private authService: AuthService, private router: Router) {}

  async register() {
    try {
      if (!this.username.trim()) {
        console.error('Username is required.');
        return;
      }

      const userCredential = await this.authService.register(this.email, this.password, this.username);
      if (userCredential.user) {
        const userId = userCredential.user.uid;

        // Save user data to Firestore
        await this.saveUserToFirestore(userId, this.username, this.email);

        // Redirect to login page
        this.router.navigate(['/login']);
      } else {
        console.error("User registration failed: No user returned.");
      }
    } catch (error) {
      console.error("Registration failed", error);
    }
  }

  private async saveUserToFirestore(userId: string, username: string, email: string): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', userId);
    await setDoc(userDocRef, {
      UID: userId,
      username,
      email,
      lastLogin: serverTimestamp(),
    });
  }
}

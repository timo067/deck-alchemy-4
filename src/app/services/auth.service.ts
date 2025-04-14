import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firestore;
  private loggedInAccounts: string[] = [];

  constructor(private afAuth: AngularFireAuth) {
    if (!getApps().length) {
      initializeApp(environment.firebase);
    }
    this.firestore = getFirestore(getApp());
  }

  async register(email: string, password: string, username: string) {
    const result = await this.afAuth.createUserWithEmailAndPassword(email, password);
    if (result.user) {
      // Use the passed 'username' directly
      this.addLoggedInUser(username);
    }
    return result;
  }

  async login(email: string, password: string) {
    const result = await this.afAuth.signInWithEmailAndPassword(email, password);
    if (result.user) {
      const token = await result.user.getIdToken();
      localStorage.setItem('authToken', token); // Store token in localStorage
      console.log('Auth token stored in localStorage.');

      const username = await this.getUsername(); // Use existing function
      if (username) {
        this.addLoggedInUser(username);
      }
    }
    return result;
  }

  logout() {
    localStorage.removeItem('authToken'); // Clear token from localStorage
    return this.afAuth.signOut();
  }

  async getUserId(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    if (user) {
      return user.uid;
    } else {
      throw new Error('User not authenticated');
    }
  }

  async getUserEmail(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.email : null;
  }

  async getUsername(): Promise<string | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const userDocRef = doc(this.firestore, 'users', userId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        return userSnap.data()?.['username'] || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching username:', error);
      return null;
    }
  }

  // Add only the username to the logged-in accounts list
  addLoggedInUser(username: string): void {
    if (!this.loggedInAccounts.includes(username)) {
      this.loggedInAccounts.push(username);
    }
  }

  getLoggedInAccounts(): string[] {
    return this.loggedInAccounts;
  }

  async validateToken(): Promise<boolean> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found in localStorage.');
      return false;
    }

    try {
      const user = await this.afAuth.currentUser;
      if (user) {
        const validToken = await user.getIdToken();
        return validToken === token; // Validate token matches
      } else {
        console.warn('No authenticated user found.');
        return false;
      }
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }
}
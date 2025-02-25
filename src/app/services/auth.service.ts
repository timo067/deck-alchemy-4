import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment'; // Ensure correct path

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firestore;

  constructor(private afAuth: AngularFireAuth) {
    // Ensure Firebase is initialized only once
    if (!getApps().length) {
      initializeApp(environment.firebase);
    }

    this.firestore = getFirestore(getApp()); // Get Firestore instance
  }

  async register(email: string, password: string) {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  async login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  async logout() {
    return this.afAuth.signOut();
  }

  async getUserId(): Promise<string | null> {
    const user = await this.afAuth.currentUser;  // Get current user
    if (user) {
      return user.uid;  // Return the user ID
    } else {
      throw new Error('User not authenticated');
    }
  }

  async getUsername(): Promise<string | null> {
    try {
      const userId = await this.getUserId();
      if (!userId) return null;

      const userDocRef = doc(this.firestore, 'Users', userId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData?.['username'] || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching username:', error);
      return null;
    }
  }
}

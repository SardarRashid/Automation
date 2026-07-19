/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Firebase config for the native Android App and Python Desktop App
const API_KEY = "AIzaSyC5Q2u1afhxzkaJyUbBVfSncBDajCW-Jb8";
const AUTH_URL = "https://identitytoolkit.googleapis.com/v1";
const DB_URL = "https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app";

export const FirebaseAPI = {
  /**
   * Login with Email and Password
   */
  async signIn(email: string, password: string) {
    try {
      const response = await fetch(`${AUTH_URL}/accounts:signInWithPassword?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Login failed");
      }
      return data; // { idToken, localId, email, etc. }
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  /**
   * Fetch user data from Realtime Database
   */
  async getUserProfile(email: string) {
    // Escape email to match RTDB keys (e.g. user@example.com -> user@example_com)
    const dbKey = email.toLowerCase().replace(/[.#$\[\]]/g, '_');
    try {
      const response = await fetch(`${DB_URL}/users/${dbKey}.json`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  /**
   * Register a new user with Email and Password
   */
  async signUp(email: string, password: string) {
    try {
      const response = await fetch(`${AUTH_URL}/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Registration failed");
      }
      return data;
    } catch (err: any) {
      throw new Error(err.message);
    }
  },

  /**
   * Update or Create user data in Realtime Database
   */
  async updateUserProfile(email: string, profileData: any) {
    const dbKey = email.toLowerCase().replace(/[.#$\[\]]/g, '_');
    try {
      const response = await fetch(`${DB_URL}/users/${dbKey}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (!response.ok) {
        throw new Error("Failed to update user profile");
      }
      return await response.json();
    } catch (err: any) {
      throw new Error(err.message);
    }
  }
};

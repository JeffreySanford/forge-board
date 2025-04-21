import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface UserData {
  name: string;
  username: string;
  title: string;
  created: string;
  modified: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  // This will be updated when actual API endpoint is provided
  private apiUrl = 'http://localhost:3000/api'; 

  // Default user data (placeholder)
  private defaultUser: UserData = {
    name: 'JEFFREY SANFORD',
    username: 'jeffrey.sanford',
    title: 'SYSTEMS ARCHITECT',
    created: '04/20/2025',
    modified: '04/20/2025'
  };

  constructor(private http: HttpClient) {}

  // Method to get user data from API when available
  getUserData(): Observable<UserData> {
    // This will be implemented when actual API is available
    // return this.http.get<UserData>(`${this.apiUrl}/user`);
    
    // For now, return default data
    return of(this.defaultUser);
  }
}

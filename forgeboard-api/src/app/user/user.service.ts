import { Injectable, NotFoundException } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { User, UserRole } from '@forge-board/shared/api-interfaces';

@Injectable()
export class UserService {
  private users = new Map<string, User>();

  constructor() {
    // Initialize with some test users
    this.seedInitialUsers();
  }

  private seedInitialUsers(): void {
    const users: User[] = [
      {
        id: 'admin-user',
        username: 'admin',
        email: 'admin@forgeboard.com',
        role: 'admin' as UserRole,
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'regular-user',
        username: 'user',
        email: 'user@forgeboard.com',
        role: 'user' as UserRole,
        lastLogin: new Date().toISOString(),
      },
      {
        id: 'guest-user-id',
        username: 'guest',
        role: 'guest' as UserRole,
        guestExpiry: new Date(Date.now() + 24*60*60*1000).toISOString(), // 24 hours
      }
    ];
    
    users.forEach(user => this.users.set(user.id, user));
  }

  findById(id: string): Observable<User | null> {
    const user = this.users.get(id);
    return of(user || null);
  }

  findByUsername(username: string): Observable<User | null> {
    const user = Array.from(this.users.values()).find(u => u.username === username);
    return of(user || null);
  }

  create(userData: Partial<User>): Observable<User> {
    if (!userData.id || !userData.username || !userData.role) {
      return throwError(() => new Error('Missing required user fields'));
    }
    
    const newUser: User = {
      ...userData as User,
      lastLogin: userData.lastLogin || new Date().toISOString(),
      preferences: userData.preferences || {}
    };
    
    this.users.set(newUser.id, newUser);
    
    return of(newUser);
  }

  updateLastLogin(id: string): Observable<User> {
    const user = this.users.get(id);
    if (!user) {
      return throwError(() => new NotFoundException(`User with ID ${id} not found`));
    }
    
    user.lastLogin = new Date().toISOString();
    this.users.set(id, user);
    
    return of(user);
  }

  getAllUsers(): Observable<User[]> {
    return of(Array.from(this.users.values()));
  }
}

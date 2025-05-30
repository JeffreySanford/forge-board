import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-control',
  templateUrl: './access-control.component.html',
  styleUrls: ['./access-control.component.scss'],
  standalone: false
})
export class AccessControlComponent implements OnInit {
  users = [
    { 
      id: 'U001', 
      name: 'John Smith', 
      role: 'Administrator', 
      status: 'active', 
      lastLogin: new Date(),
      permissions: ['read', 'write', 'delete', 'admin']
    },
    { 
      id: 'U002', 
      name: 'Jane Doe', 
      role: 'Security Analyst', 
      status: 'active', 
      lastLogin: new Date(Date.now() - 86400000),
      permissions: ['read', 'write']
    },
    { 
      id: 'U003', 
      name: 'Bob Johnson', 
      role: 'Developer', 
      status: 'inactive', 
      lastLogin: new Date(Date.now() - 604800000),
      permissions: ['read']
    }
  ];

  displayedColumns: string[] = ['id', 'name', 'role', 'status', 'lastLogin', 'actions'];
  
  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('[AccessControlComponent] Initialized');
  }

  getStatusClass(status: string): string {
    return status.toLowerCase() === 'active' ? 'active' : 'inactive';
  }
  
  modifyUser(userId: string, action: string): void {
    console.log(`Action ${action} on user ${userId}`);
    // Implement user modification logic
  }
}

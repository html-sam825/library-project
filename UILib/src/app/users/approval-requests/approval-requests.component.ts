import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountStatus, User } from '../../service/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../service/data.service';
import { Subject, takeUntil } from 'rxjs';
import { Route } from '@angular/router';

@Component({
  selector: 'approval-requests',
  templateUrl: './approval-requests.component.html',
  standalone: false,
  styleUrls: ['./approval-requests.component.scss'],
})
export class ApprovalRequestsComponent implements OnInit, OnDestroy {
  columns: string[] = [
    'userId',
    'userName',
    'email',
    'mobileNumber',
    'userType',
    'createdOn',
    'approve',
  ];
  
  users: User[] = [];
  isLoading: boolean = true;
  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService, 
    private snackBar: MatSnackBar,
    
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadPendingApprovals();
  }

  checkAuthStatus(): void {
    const user = this.dataService.getUserInfo();
    const token = localStorage.getItem('access_token');
    
    console.log('=== AUTH STATUS CHECK ===');
    console.log('Current user:', user);
    console.log('Token exists:', !!token);
    console.log('Token value:', token ? '***' + token.slice(-10) : 'No token');
    console.log('User type:', user?.userType);
    console.log('Account status:', user?.accountStatus);
    console.log('=========================');
    
    if (!user || !token) {
      this.showError('Please log in to access approval requests.');
      
      setTimeout(() => {
      //  this.router.navigate(['/login']); 
      }, 2000);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  
  approve(user: User): void {
    console.log('=== APPROVE USER DEBUG ===');
    console.log('User to approve:', user);
    console.log('User ID:', user.id);
    console.log('User accountStatus:', user.accountStatus);

    if (!user || !user.id) {
      this.showError('Invalid user data. Cannot approve.');
      return;
    }

    const confirmMessage = `Are you sure you want to approve ${user.firstName} ${user.lastName}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    console.log('Calling dataService.approveUser...');

    this.dataService.approveUser(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          console.log('Approve user response:', res);
          
          if (res.message?.includes('approved') || res === 'approved' || res.success) {
            this.showSuccess(`Successfully approved ${user.firstName} ${user.lastName}!`);
            
            
            this.users = this.users.filter(u => u.id !== user.id);
            
            console.log('User removed from list. Remaining users:', this.users.length);
          } else {
            this.showError(`Failed to approve ${user.firstName} ${user.lastName}. Please try again.`);
          }
        },
        error: (err) => {
          console.error('Error approving user:', err);
          console.error('Error status:', err.status);
          console.error('Error message:', err.message);
          console.error('Error response:', err.error);
          
          let errorMessage = `Failed to approve ${user.firstName} ${user.lastName}. Please try again.`;
          
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.status === 404) {
            errorMessage = 'User not found. Please refresh the list.';
          } else if (err.status === 403) {
            errorMessage = 'You do not have permission to approve users.';
          } else if (err.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          
          this.showError(errorMessage);
        }
      });
  }

  loadPendingApprovals(): void {
    this.isLoading = true;
    this.dataService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log('=== API RESPONSE DEBUG ===');
          console.log('Full response:', res);
          console.log('Response type:', typeof res);
          console.log('Is array?', Array.isArray(res));
          console.log('Response keys:', Object.keys(res));
          
          
          let usersArray: User[] = [];
          
          if (Array.isArray(res)) {
            
            usersArray = res;
          } else if (res.data && Array.isArray(res.data)) {
           
            usersArray = res.data;
          } else if (res.users && Array.isArray(res.users)) {
            
            usersArray = res.users;
          } else if (res.result && Array.isArray(res.result)) {
            
            usersArray = res.result;
          } else {
            console.error('Unexpected response format:', res);
            this.showError('Unexpected response format from server.');
            return;
          }
          
          console.log('Extracted users array:', usersArray);
          
        
          this.users = usersArray.filter(
            (user) => user.accountStatus === AccountStatus.UNAPPROVED
          );
          
          console.log('Filtered pending approval users:', this.users);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading pending approvals:', err);
          
          if (err.status === 401) {
            this.showError('Your session has expired. Please log in again.');
          } else {
            this.showError('Failed to load pending approval requests. Please try again.');
          }
        }
      });
  }
  
  approveAll(): void {
    if (this.users.length === 0) {
      this.showInfo('No pending approval requests to approve.');
      return;
    }

    const confirmMessage = `Are you sure you want to approve all ${this.users.length} pending requests?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    
    this.showInfo('Bulk approval feature would be implemented here.');
  }

  refresh(): void {
    this.loadPendingApprovals();
    this.showInfo('Refreshing pending approval requests...');
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }

  getUserDisplayName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim();
  } 
}
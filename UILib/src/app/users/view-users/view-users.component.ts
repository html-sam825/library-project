import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountStatus, User, UserType } from '../../service/models';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-view-users',
  standalone: false,
  templateUrl: './view-users.component.html',
  styleUrl: './view-users.component.scss'
})
export class ViewUsersComponent implements OnInit, OnDestroy {
  columns: string[] = [
    'userId',
    'userName',
    'email',
    'mobileNumber',
    'userType',
    'accountStatus',
    'createdOn',
    'actions' 
  ];
  
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';
  selectedUserType: string = 'ALL';
  selectedStatus: string = 'ALL';
  isRefreshing: boolean = false;
  
  userTypeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: UserType.ADMIN, label: 'Admin' },
    { value: UserType.STUDENT, label: 'Student' }
  ];
  
  statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: AccountStatus.APPROVED, label: 'Approved' },
    { value: AccountStatus.BLOCKED, label: 'Blocked' },
    { value: AccountStatus.UNAPPROVED, label: 'Pending' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService, 
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    
    this.dataService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: User[]) => {
          this.isLoading = false;
          this.isRefreshing = false;
          this.users = [...res];
          this.filteredUsers = [...res];
          console.log('Loaded users:', this.users.length);
        },
        error: (err: any) => { 
          this.isLoading = false;
          this.isRefreshing = false;
          console.error('Error loading users:', err);
          let errorMessage = 'Failed to load users. Please try again.';
          
          if (err.status === 401) {
            errorMessage = 'Session expired. Please login again.';
          } else if (err.status === 403) {
            errorMessage = 'You do not have permission to view users.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          }
          
          this.showError(errorMessage);
        }
      });
  }

  unblockUser(user: User): void {
    if (!user || !user.id) {
      this.showError('Invalid user data. Cannot unblock.');
      return;
    }

    const confirmMessage = `Are you sure you want to unblock ${user.firstName} ${user.lastName}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    this.dataService.unblockUser(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => { 
          
          if (res.message?.includes('unblocked') || res.status === 'success' || res === 'unblocked') {
            this.showSuccess(`Successfully unblocked ${user.firstName} ${user.lastName}!`);
            
           
            const updatedUsers = this.users.map(u => 
              u.id === user.id 
                ? { ...u, accountStatus: AccountStatus.APPROVED } 
                : u
            );
            
            this.users = updatedUsers;
            this.applyFilters(); 
          } else {
            this.showError(`Failed to unblock ${user.firstName} ${user.lastName}. Please try again.`);
          }
        },
        error: (err: any) => { 
          console.error('Error unblocking user:', err);
          let errorMessage = `Failed to unblock ${user.firstName} ${user.lastName}. Please try again.`;
          
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.status === 404) {
            errorMessage = 'User not found. Please refresh the list.';
          } else if (err.status === 401) {
            errorMessage = 'Session expired. Please login again.';
          } else if (err.status === 403) {
            errorMessage = 'You do not have permission to unblock users.';
          }
          
          this.showError(errorMessage);
        }
      });
  }

  
  blockUser(user: User): void {
    if (!user || !user.id) {
      this.showError('Invalid user data. Cannot block.');
      return;
    }

    const confirmMessage = `Are you sure you want to block ${user.firstName} ${user.lastName}?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    this.dataService.blockUser(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          
          if (res.message?.includes('blocked') || res.status === 'success' || res === 'blocked') {
            this.showSuccess(`Successfully blocked ${user.firstName} ${user.lastName}!`);
            
            
            const updatedUsers = this.users.map(u => 
              u.id === user.id 
                ? { ...u, accountStatus: AccountStatus.BLOCKED } 
                : u
            );
            
            this.users = updatedUsers;
            this.applyFilters();
          } else {
            this.showError(`Failed to block ${user.firstName} ${user.lastName}. Please try again.`);
          }
        },
        error: (err: any) => {
          console.error('Error blocking user:', err);
          let errorMessage = `Failed to block ${user.firstName} ${user.lastName}. Please try again.`;
          
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.status === 404) {
            errorMessage = 'User not found. Please refresh the list.';
          } else if (err.status === 401) {
            errorMessage = 'Session expired. Please login again.';
          } else if (err.status === 403) {
            errorMessage = 'You do not have permission to block users.';
          }
          
          this.showError(errorMessage);
        }
      });
  }

  searchUsers(searchValue: string): void {
    this.searchTerm = searchValue.toLowerCase().trim();
    this.applyFilters();
  }

  onUserTypeChange(userType: string): void {
    this.selectedUserType = userType;
    this.applyFilters();
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.firstName.toLowerCase().includes(this.searchTerm) ||
        user.lastName.toLowerCase().includes(this.searchTerm) ||
        user.email.toLowerCase().includes(this.searchTerm) ||
        (user.mobileNumber && user.mobileNumber.includes(this.searchTerm));

      const matchesUserType = this.selectedUserType === 'ALL' || 
        user.userType === this.selectedUserType;

      const matchesStatus = this.selectedStatus === 'ALL' || 
        user.accountStatus === this.selectedStatus;

      return matchesSearch && matchesUserType && matchesStatus;
    });
  }

  getUserStats(): any {
    const total = this.users.length;
    const admins = this.users.filter(u => u.userType === UserType.ADMIN).length;
    const students = this.users.filter(u => u.userType === UserType.STUDENT).length;
    const approved = this.users.filter(u => u.accountStatus === AccountStatus.APPROVED).length;
    const blocked = this.users.filter(u => u.accountStatus === AccountStatus.BLOCKED).length;
    const pending = this.users.filter(u => u.accountStatus === AccountStatus.UNAPPROVED).length;

    return {
      total,
      admins,
      students,
      approved,
      blocked,
      pending
    };
  }

  refreshUsers(): void {
    this.isRefreshing = true;
    this.loadUsers();
    this.showInfo('Refreshing users list...');
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedUserType = 'ALL';
    this.selectedStatus = 'ALL';
    this.filteredUsers = [...this.users];
  }

  
  canUnblock(user: User): boolean {
    return user.accountStatus === AccountStatus.BLOCKED;
  }

  canBlock(user: User): boolean {
    return user.accountStatus === AccountStatus.APPROVED;
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


  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }
}
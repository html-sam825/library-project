import { Component, OnInit } from '@angular/core';
import { DataService } from '../../service/data.service';
import { UserType, AccountStatus, User } from '../../service/models';

export interface TableElement {
  name: string;
  value: string;
  icon?: string;
  type?: 'text' | 'date' | 'status' | 'type';
}

@Component({
  selector: 'profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  columns: string[] = ['name', 'value'];
  dataSource: TableElement[] = [];
  user: User | null = null;
  isLoading: boolean = true;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.user = this.dataService.getUserInfo();
    
    if (!this.user) {
      console.error('No user information found');
      this.dataSource = [{
        name: 'Error',
        value: 'Unable to load profile information',
        icon: 'error',
        type: 'text'
      }];
      this.isLoading = false;
      return;
    }

    this.dataSource = [
      {
        name: 'Name', 
        value: `${this.user.firstName} ${this.user.lastName}`,
        icon: 'person',
        type: 'text'
      },
      {
        name: 'Email', 
        value: this.user.email,
        icon: 'email',
        type: 'text'
      },
      {
        name: 'Mobile Number', 
        value: this.user.mobileNumber || 'Not provided',
        icon: 'phone',
        type: 'text'
      },
      {
        name: 'Account Status', 
        value: this.getAccountStatusText(this.user.accountStatus),
        icon: this.getStatusIcon(this.user.accountStatus),
        type: 'status'
      },
      {
        name: 'User Type', 
        value: this.getUserTypeText(this.user.userType),
        icon: this.getUserTypeIcon(this.user.userType),
        type: 'type'
      },
      {
        name: 'Member Since', 
        value: this.formatDate(this.user.createdOn),
        icon: 'calendar_today',
        type: 'date'
      }
    ];

    this.isLoading = false;
  }

  private getAccountStatusText(status: AccountStatus): string {
    switch (status) {
      case AccountStatus.APPROVED:
        return 'Approved';
      case AccountStatus.BLOCKED:
        return 'Blocked';
      case AccountStatus.UNAPPROVED:
        return 'Pending Approval';
      default:
        return 'Unknown';
    }
  }

  private getStatusIcon(status: AccountStatus): string {
    switch (status) {
      case AccountStatus.APPROVED:
        return 'check_circle';
      case AccountStatus.BLOCKED:
        return 'block';
      case AccountStatus.UNAPPROVED:
        return 'pending';
      default:
        return 'help';
    }
  }

  private getUserTypeText(userType: UserType): string {
    return UserType[userType] || 'Unknown';
  }

  private getUserTypeIcon(userType: UserType): string {
    switch (userType) {
      case UserType.ADMIN:
        return 'admin_panel_settings';
      case UserType.STUDENT:
        return 'school';
      default:
        return 'person';
    }
  }

  
  formatDate(dateString: any): string {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? 'Invalid date' 
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
    } catch {
      return 'Invalid date';
    }
  }

  
  getCurrentDate(): string {
    return this.formatDate(new Date());
  }


  getStatusClass(value: string, type?: string): string {
    if (type === 'status') {
      if (value.includes('Approved')) {
        return 'status-approved';
      } else if (value.includes('Blocked')) {
        return 'status-blocked';
      } else if (value.includes('Pending')) {
        return 'status-pending';
      }
    }
    return '';
  }

 
  refreshProfile(): void {
    this.isLoading = true;
  
    setTimeout(() => {
      this.loadUserProfile();
    }, 1000);
  }
}
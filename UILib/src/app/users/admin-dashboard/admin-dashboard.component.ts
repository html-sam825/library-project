import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../service/data.service';
import { Subscription } from 'rxjs';

interface DashboardStats {
  totalBooks: number;
  activeUsers: number;
  pendingApprovals: number;
  activeOrders: number;
  booksAddedThisMonth: number;
  newUsersThisWeek: number;
  overdueOrders: number;
}

interface Activity {
  type: string;
  icon: string;
  description: string;
  time: string;
}

interface PendingApproval {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  requestDate: string;
}

@Component({
  selector: 'admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  adminName: string = 'Loading...';
  stats: DashboardStats = {
    totalBooks: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    activeOrders: 0,
    booksAddedThisMonth: 0,
    newUsersThisWeek: 0,
    overdueOrders: 0
  };

  recentActivities: Activity[] = [];
  pendingApprovals: PendingApproval[] = [];
  storageUsage: number = 0;
  isLoading: boolean = true;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    
    this.subscriptions.add(
      this.dataService.getAdminProfile().subscribe({
        next: (profile: any) => {
          this.adminName = profile.fullName || 'Administrator';
        },
        error: (error) => {
          console.error('Error loading admin profile:', error);
        
          const currentUser = this.dataService.getUserInfo();
          this.adminName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Administrator';
        }
      })
    );

    
    this.subscriptions.add(
      this.dataService.getDashboardStats().subscribe({
        next: (data: any) => {
          this.stats = {
            totalBooks: data.totalBooks || 0,
            activeUsers: data.activeUsers || 0,
            pendingApprovals: data.pendingApprovals || 0,
            activeOrders: data.activeOrders || 0,
            booksAddedThisMonth: data.booksAddedThisMonth || 0,
            newUsersThisWeek: data.newUsersThisWeek || 0,
            overdueOrders: data.overdueOrders || 0
          };
        },
        error: (error) => {
          console.error('Error loading dashboard stats:', error);
          this.setDefaultStats();
        }
      })
    );

    
    this.subscriptions.add(
      this.dataService.getRecentActivities().subscribe({
        next: (activities: any[]) => {
          this.recentActivities = activities.map(activity => ({
            type: activity.activityType || activity.type,
            icon: this.getActivityIcon(activity.activityType || activity.type),
            description: activity.description,
            time: this.formatTime(activity.timestamp || activity.createdAt)
          }));
        },
        error: (error) => {
          console.error('Error loading recent activities:', error);
          this.setDefaultActivities();
        }
      })
    );

    
    this.subscriptions.add(
      this.dataService.getPendingApprovals().subscribe({
        next: (approvals: any[]) => {
          this.pendingApprovals = approvals.map(approval => ({
            id: approval.id || approval.userId,
            firstName: approval.firstName,
            lastName: approval.lastName,
            email: approval.email,
            requestDate: this.formatDate(approval.createdAt || approval.requestDate)
          }));
        },
        error: (error) => {
          console.error('Error loading pending approvals:', error);
          this.setDefaultApprovals();
        }
      })
    );

    // Load system health
    this.subscriptions.add(
      this.dataService.getSystemHealth().subscribe({
        next: (systemInfo: any) => {
          this.storageUsage = systemInfo.storageUsage || 0;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading system health:', error);
          this.storageUsage = 0;
          this.isLoading = false;
        }
      })
    );
  }

  private setDefaultStats(): void {
    this.stats = {
      totalBooks: 0,
      activeUsers: 0,
      pendingApprovals: 0,
      activeOrders: 0,
      booksAddedThisMonth: 0,
      newUsersThisWeek: 0,
      overdueOrders: 0
    };
  }

  private setDefaultActivities(): void {
    this.recentActivities = [
      {
        type: 'system',
        icon: 'warning',
        description: 'Unable to load recent activities',
        time: 'Just now'
      }
    ];
  }

  private setDefaultApprovals(): void {
    this.pendingApprovals = [];
  }

  private getActivityIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'user_registration': 'person_add',
      'book_added': 'library_add',
      'order_placed': 'shopping_cart',
      'book_returned': 'assignment_return',
      'user_approved': 'how_to_reg',
      'user_rejected': 'person_remove',
      'book_updated': 'edit',
      'book_deleted': 'delete',
      'system': 'warning',
      'user': 'person_add',
      'book': 'library_add',
      'order': 'shopping_cart',
      'return': 'assignment_return'
    };
    return iconMap[type] || 'notifications';
  }

  private formatTime(timestamp: string): string {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const activityTime = new Date(timestamp);
    
    if (isNaN(activityTime.getTime())) {
      return 'Recently';
    }
    
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  }

  refreshData(): void {
    this.isLoading = true;
    this.loadDashboardData();
  }

  navigateTo(route: string): void {
    
    this.router.navigate([`/${route}`]);
  }

  navigateToApprovals(): void {
    this.router.navigate(['/approval-requests']);
  }

  

  approveUser(userId: number): void {
    this.dataService.approveUser(userId).subscribe({
      next: () => {
        this.pendingApprovals = this.pendingApprovals.filter(approval => approval.id !== userId);
        this.stats.pendingApprovals--;
        
       
        const approvedUser = this.pendingApprovals.find(a => a.id === userId);
        if (approvedUser) {
          this.recentActivities.unshift({
            type: 'user_approved',
            icon: 'how_to_reg',
            description: `Approved user: ${approvedUser.firstName} ${approvedUser.lastName}`,
            time: 'Just now'
          });
        }
      },
      error: (error) => {
        console.error('Error approving user:', error);
        
      }
    });
  }

  rejectUser(userId: number): void {
    this.dataService.rejectUser(userId).subscribe({
      next: () => {
       
        this.pendingApprovals = this.pendingApprovals.filter(approval => approval.id !== userId);
        this.stats.pendingApprovals--;
        
        
        const rejectedUser = this.pendingApprovals.find(a => a.id === userId);
        if (rejectedUser) {
          this.recentActivities.unshift({
            type: 'user_rejected',
            icon: 'person_remove',
            description: `Rejected user: ${rejectedUser.firstName} ${rejectedUser.lastName}`,
            time: 'Just now'
          });
        }
      },
      error: (error) => {
        console.error('Error rejecting user:', error);
       
      }
    });
  }
}
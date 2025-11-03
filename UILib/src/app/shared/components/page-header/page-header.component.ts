import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { DataService } from '../../../service/data.service';
import { AccountStatus, User, UserType } from '../../../service/models';

interface QuickLink {
  label: string;
  route: string;
  icon: string;
  roles: UserType[]; 
}

@Component({
  selector: 'page-header',
  standalone:false,
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit, OnDestroy {
  @Input() showMenuButton: boolean = false;
  @Output() toggleSidenav = new EventEmitter<void>();

  loggedIn: boolean = false;
  name: string = '';
  userType: UserType | null = null;
  accountStatus: AccountStatus | null = null;
  currentRoute: string = '';
  user: User | null = null;
  notificationCount: number = 0;
  
  quickLinks: QuickLink[] = [
    { label: 'Dashboard', route: '/admin-dashboard', icon: 'dashboard', roles: [UserType.ADMIN, UserType.STUDENT] },
    { label: 'Books', route: '/book-store', icon: 'book', roles: [UserType.ADMIN, UserType.STUDENT] },
    { label: 'My Orders', route: '/user-orders', icon: 'shopping_cart', roles: [UserType.STUDENT] },
    { label: 'All Orders', route: '/all-orders', icon: 'list_alt', roles: [UserType.ADMIN] },
    { label: 'Users', route: '/view-users', icon: 'people', roles: [UserType.ADMIN] }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupUserSubscription();
    this.setupRouteTracking();
    this.checkInitialAuthState();
    this.setupNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupUserSubscription(): void {
    this.dataService.userStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status: string) => {
          this.handleUserStatusChange(status);
        }
      });
  }

  private setupRouteTracking(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.currentRoute = event.urlAfterRedirects || event.url;
      });
  }

  private checkInitialAuthState(): void {
    const user = this.dataService.getUserInfo();
    if (user) {
      this.setUserData(user);
    }
  }

  private setupNotifications(): void {
    
    this.notificationCount = Math.floor(Math.random() * 5);
  }

  private handleUserStatusChange(status: string): void {
    if (status === 'loggedIn') {
      const user = this.dataService.getUserInfo();
      if (user) {
        this.setUserData(user);
      }
    } else {
      this.clearUserData();
    }
  }

  private setUserData(user: User): void {
    this.loggedIn = true;
    this.name = `${user.firstName} ${user.lastName}`;
    this.userType = user.userType;
    this.accountStatus = user.accountStatus;
    this.user = user;
  }

  private clearUserData(): void {
    this.loggedIn = false;
    this.name = '';
    this.userType = null;
    this.accountStatus = null;
    this.user = null;
    this.notificationCount = 0;
  }

 
  get filteredQuickLinks(): QuickLink[] {
    if (!this.userType) return [];
    return this.quickLinks.filter(link => link.roles.includes(this.userType!));
  }

  logout(): void {
    this.dataService.logOut();
    this.router.navigate(['/login']);
  }

  openNotifications(): void {
    
    console.log('Open notifications');
    
    this.notificationCount = 0; 
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToDashboard(): void {
    if (this.userType === UserType.ADMIN) {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/admin-dashboard']);
    }
  }

  getUserBadgeColor(): string {
    if (!this.userType) return 'basic';
    
    switch (this.userType) {
      case UserType.ADMIN:
        return 'accent';
      case UserType.STUDENT:
        return 'primary';
      default:
        return 'basic';
    }
  }

  getUserBadgeText(): string {
    if (!this.userType) return '';
    
    switch (this.userType) {
      case UserType.ADMIN:
        return 'Admin';
      case UserType.STUDENT:
        return 'Student';
      default:
        return 'User';
    }
  }

  getAccountStatusText(): string {
    if (!this.accountStatus) return '';
    
    switch (this.accountStatus) {
      case AccountStatus.APPROVED:
        return 'Active';
      case AccountStatus.BLOCKED:
        return 'Blocked';
      case AccountStatus.UNAPPROVED:
        return 'Pending Approval';
      default:
        return 'Unknown';
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  isUserApproved(): boolean {
    return this.accountStatus === AccountStatus.APPROVED;
  }

  
  canAccessRoute(route: string): boolean {
    const link = this.quickLinks.find(l => l.route === route);
    return link ? link.roles.includes(this.userType!) : false;
  }
}
import { Component, OnInit } from '@angular/core';

import { Router, NavigationEnd } from '@angular/router';

import { filter } from 'rxjs/operators';
import { DataService } from '../../../service/data.service';
import { UserType } from '../../../service/models';

export interface NavigationItem {
  value: string;
  link: string;
}

@Component({
  selector: 'page-side-nav',
  standalone: false,
  templateUrl: './page-side-nav.component.html',
  styleUrls: ['./page-side-nav.component.scss']
})
export class PageSideNavComponent implements OnInit {
  panelName: string = 'Library System';
  navItems: NavigationItem[] = [];
  activeLink: string = '';

  constructor(
    public dataService: DataService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupUserSubscription();
    this.setupRouteTracking();
    this.initializeNavigation();
  }

  private setupUserSubscription(): void {
    this.dataService.userStatus.subscribe({
      next: (status: string) => {
        if (status === 'loggedIn') {
          const user = this.dataService.getUserInfo();
          this.setNavigationForUser(user);
        } else if (status === 'loggedOff') {
          this.setGuestNavigation();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  private setupRouteTracking(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeLink = event.urlAfterRedirects || event.url;
      });
  }

  private initializeNavigation(): void {
    const user = this.dataService.getUserInfo();
    if (user) {
      this.setNavigationForUser(user);
    } else {
      this.setGuestNavigation();
    }
  }

  private setNavigationForUser(user: any): void {
    if (user.userType === UserType.ADMIN) {
      this.panelName = 'Admin Panel';
      this.navItems = [
        { value: 'Dashboard', link: '/admin-dashboard' },
        { value: 'View Books', link: '/book-store' },
        { value: 'Book Maintenance', link: '/maintanance' },
        { value: 'Return Book', link: '/return-book' },
        { value: 'View Users', link: '/view-users' },
        { value: 'Order Approvals', link: '/order-approvals' },
        { value: 'Approval Requests', link: '/approval-requests' },
        { value: 'All Orders', link: '/all-orders' }
      ];
    } else if (user.userType === UserType.STUDENT) {
      this.panelName = 'Student Panel';
      this.navItems = [
        { value: 'Dashboard', link: '/student-dashboard' },
        { value: 'View Books', link: '/book-store' },
        { value: 'My Orders', link: '/my-orders' },
         
      ];
    }
  }

  private setGuestNavigation(): void {
    this.panelName = 'Library System';
    this.navItems = [
      { value: 'Login', link: '/login' },
      { value: 'Sign Up', link: '/signup' }
    ];
  }


  isActive(link: string): boolean {
    return this.activeLink === link || this.activeLink.startsWith(link);
  }

  onNavItemClick(item: NavigationItem): void {
    console.log('Navigating to:', item.link);
  }

  logout(): void {
    this.dataService.logOut();
  }

  trackByLink(index: number, item: NavigationItem): string {
    return item.link;
  }
  


getIconForItem(itemValue: string): string {
  const iconMap: { [key: string]: string } = {
    'Dashboard': 'dashboard',
    'View Books': 'library_books',
    'Book Maintenance': 'build',
    'Return Book': 'assignment_return',
    'View Users': 'people',
    'Approval Requests': 'how_to_reg',
    'All Orders': 'shopping_cart',
    'My Orders': 'shopping_basket',
    'Login': 'login',
    'Sign Up': 'person_add'
  };
  return iconMap[itemValue] || 'chevron_right';
}


getBadgeCount(itemValue: string): number {
  
  const badgeMap: { [key: string]: number } = {
    'Approval Requests': 0,
    'All Orders': 0 
  };
  return badgeMap[itemValue] || 0;
}
}
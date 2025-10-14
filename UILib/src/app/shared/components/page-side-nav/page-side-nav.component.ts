import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../service/data.service';
import { Router } from '@angular/router';
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

  panelName: string = '';
  navItems: NavigationItem[] = [];

  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit(): void {
    this.dataService.userStatus.subscribe({
      next: (status: string) => {
        if (status === 'loggedIn') {
          const user = this.dataService.getUserInfo();

          if (user) {
            if (user.userType === UserType.ADMIN) {
              this.panelName = 'Admin Panel';
              this.navItems = [
                { value: 'View Books', link: '/home' },
                { value: 'Maintenance', link: '/maintenance' },
                { value: 'Return Book', link: '/return-book' },
                { value: 'View Users', link: '/view-users' },
                { value: 'Approval Requests', link: '/approval-requests' },
                { value: 'All Orders', link: '/all-orders' },
                { value: 'Add Books', link: '/add-books' },
                
              ];
            } else if (user.userType === UserType.STUDENT) {
              this.panelName = 'Student Panel';
              this.navItems = [
                { value: 'View Books', link: '/home' },
                { value: 'My Orders', link: '/my-orders' }
              ];
            }
          }

        } else if (status === 'loggedOff') {
          this.panelName = 'Auth Panel';
          this.router.navigateByUrl('/login');
          this.navItems = [];
        }
      }
    });
  }

  trackByLink(index: number, item: NavigationItem): string {
    return item.link;
  }
}

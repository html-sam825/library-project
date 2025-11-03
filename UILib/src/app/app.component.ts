import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';

import { AuthModule } from './auth/auth.module';
import { DataService } from './service/data.service';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';
import { SharedModule } from './shared/shared.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    SharedModule,
    AuthModule,
    UsersModule,
    BooksModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'UILib';
  isSidenavOpen = true;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
   
    const status = this.dataService.isLoggedIn() ? 'loggedIn' : 'loggedOff';
    this.dataService.userStatus.next(status);

   
    this.handleResponsiveSidenav();
    window.addEventListener('resize', () => this.handleResponsiveSidenav());
  }

  private handleResponsiveSidenav(): void {
    if (window.innerWidth < 768) {
      this.isSidenavOpen = false;
    } else {
      this.isSidenavOpen = true;
    }
  }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }
}
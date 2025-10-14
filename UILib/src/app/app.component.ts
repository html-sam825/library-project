import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { DataService } from './service/data.service';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SharedModule,
    AuthModule,
    UsersModule,
    BooksModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  ngOnit(): void{
    let status = this.dataService.isLoggedIn() ? 'LoggedIn' : 'LoggedOff';
    this.dataService.userStatus.next(status);
  }
  title = 'UILib';
  constructor(private dataService: DataService) {}
  ngOnInit(): void {
    let status = this.dataService.isLoggedIn() ? 'loggedIn' : 'loggedOff';
    this.dataService.userStatus.next(status);
  }
}

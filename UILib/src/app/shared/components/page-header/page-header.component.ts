import { Component } from '@angular/core';
import { DataService } from '../../../service/data.service';

@Component({
  selector: 'page-header',
  standalone: false,
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent {
  loggedIn: boolean = false;
  name: string = '';
  constructor(private dataService: DataService) {
  this.dataService.userStatus.subscribe({
    next: (res) => {
      if (res === 'loggedIn') {
        const user = this.dataService.getUserInfo();
        if (user) {  
          this.loggedIn = true;
          this.name = `${user.firstName} ${user.lastName}`;
        } else {
          this.loggedIn = false;
          this.name = '';
        }
      } else {
        this.loggedIn = false;
        this.name = '';
      }
    }
  });
}

  logout() {
    this.dataService.logOut();
  }

}

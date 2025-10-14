import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AccountStatus, Order, User, UserType } from '../../service/models';
import { DataService } from '../../service/data.service';

@Component({
  selector: 'page-table',
  standalone: false,
  templateUrl: './page-table.component.html',
  styleUrls: ['./page-table.component.scss'] 
})
export class PageTableComponent {
  @Input() columns: string[] = ['userId', 'userName'];
  @Input() dataSource: any[] = [];

  @Output() approve = new EventEmitter<User>();
  @Output() unblock = new EventEmitter<User>();

  constructor(private dataService: DataService) {}

  getFineToPay(order: Order) {
    return this.dataService.getFine(order);
  }

  getUserType(user: User) {
    return UserType[user.userType];
  }

  getAccountStatus(input: AccountStatus) {
    return AccountStatus[input];
  }
}

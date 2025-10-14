import { Component } from '@angular/core';
import { DataService } from '../../service/data.service';
import { UserType } from '../../service/models';

export interface TableElement{
  name : string;
  value: string;
}
@Component({
  selector: 'profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  columns:string[]=['name', 'value'];
  dataSource: TableElement[] = [];

  constructor(private dataService:DataService){
    let user = dataService.getUserInfo()!;
    this.dataSource =[
      {name:"Name", value: user.firstName + "" + user.lastName},
      {name:"Email", value: `${user.email}`},
      {name: "Mobile", value: `${user.mobileNumber}`},
      {name: "Account Status", value: `${user.accountStatus}`},
      {name: "createdOn", value: `${user.createdOn}`},
      {name: "User Type", value: `${UserType[user.userType]}`},
    ]
  }


}

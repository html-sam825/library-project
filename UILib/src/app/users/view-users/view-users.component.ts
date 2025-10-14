import { Component } from '@angular/core';
import { AccountStatus, User, UserType } from '../../service/models';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-view-users',
  standalone: false,
  templateUrl: './view-users.component.html',
  styleUrl: './view-users.component.scss'
})
export class ViewUsersComponent {

  columns : string[] =[
    ' userId',
    'userName',
    'email',
    'mobileNumber',
    'createdOn',
    'accountStatus',
    'unblock',
    'userType',
  ];
  users:User[] =[];

  constructor(private dataService: DataService, private snackBar: MatSnackBar ){
    dataService.getUsers().subscribe({
      next: (res: User[]) => {
        this.users =[];
        res.forEach((r) => this.users.push(r));
      },

      });

  }
  unblockUser (user: User) {
    var id = user.id;
    this.dataService.unblock(id).subscribe({
      next: (res) =>{
        if (res === 'unblocked') {
          this.snackBar.open('User has been UNBLOCKED!', 'OK');

        } else this.snackBar.open('Not Unblocked', 'OK');
      }
    })
  }
}

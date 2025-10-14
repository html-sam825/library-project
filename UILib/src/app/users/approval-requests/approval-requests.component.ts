import { Component } from '@angular/core';
import { AccountStatus, User } from '../../service/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../service/data.service';



@Component({
  selector: 'approval-requests',
  templateUrl: './approval-requests.component.html',
  standalone: false,
  styleUrls: ['./approval-requests.component.scss'],
})
export class ApprovalRequestsComponent {
  columns: string[] = [
    'userId',
    'userName',
    'email',
    'userType',
    'createdOn',
    'approve',
  ];
  users: User[] = [];

  constructor(private dataService: DataService, private snackBar: MatSnackBar) {
    dataService.getUsers().subscribe({
      next: (res: User[]) => {
        console.log(res);
        this.users = res.filter(
          (r) => r.accountStatus == AccountStatus.UNAPPROVED
        );
      },
    });
  }

  approve(user: User) {
    this.dataService.approveRequest(user.id).subscribe({
      next: (res) => {
        if (res === 'approved') {
          this.snackBar.open(`Approved for ${user.id}`, 'OK');
        } else this.snackBar.open(`Not Approved`, 'OK');
      },
    });
  }

}

import { Component } from '@angular/core';
import { Order } from '../../service/models';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-all-orders',
  standalone: false,
  templateUrl: './all-orders.component.html',
  styleUrl: './all-orders.component.scss'
})
export class AllOrdersComponent {

  columnsForPendingReturns: string[] = [
    'orderId',
    'userIdForOrder',
    'userNameForOrder',
    'bookId',
    'orderDate',
    'fineToPay',
  ];

  columnsForCompletedReturns: string[] = [
    'orderId',
    'userId',
    'userNameForOrder',
    'bookId',
    'orderDate',
    'returnDate',
    'finePaid',
  ];

  showProgressBar: boolean = false;
  ordersWithPendingReturns: Order[] = [];
  orderWithCompletedReturns: Order[] = [];

  constructor(private dataService: DataService, private snackBar: MatSnackBar) {
    dataService.getOrders().subscribe({
      next: (res: Order[])=>{
        this.ordersWithPendingReturns = res.filter(o => !o.returned);
        this.orderWithCompletedReturns = res.filter(o => o.returned); 
 
      },
      error: (err) => {
        this.snackBar.open('No orders found', 'OK');
      }
    });
  }
  sendEmail(){
    this.showProgressBar = true;
    this.dataService.sendEmail().subscribe({
      next: (res) =>{
        if(res === 'sent') {
          this.snackBar.open(
            'Emails have been Sent to respected Students!', 'OK'
          );
          this.showProgressBar =false;

        } else{
          this.snackBar.open('Emails have not been sent!', 'OK');
          this.showProgressBar =false;
        }
      },
    })
  }

  blockUsers() {
    this.showProgressBar = true;
    this.dataService.blockUsers().subscribe({
      next: (res) =>{
        if (res === 'blocked'){
        this.snackBar.open('Eligible Users Accounts were BLOCKED!', 'OK');
        this.showProgressBar = false;

      } else {
        this.snackBar.open('Not BLOCKED!', 'OK');
        this.showProgressBar =false;
        
      }
    },

    });
  }
}

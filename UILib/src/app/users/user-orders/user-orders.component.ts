import { Component } from '@angular/core';
import { Order } from '../../service/models';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'user-orders',
  standalone: false,
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.scss'
})
export class UserOrdersComponent {
columnsForPendingReturns: string[] = [
  'orderId',
  'bookId',
  'bookTitle',
  'orderDate',
  'fineToPay'
];
columnsForReturnedBooks: string[] = [
  'orderId',
  'bookId',
  'bookTitle',
  'orderDate',
  'returnedDate',
  'finePaid'
];
pendingReturns: Order[]=[];
completedReturns: Order[]=[];

constructor(private dataService: DataService, private snackBar:MatSnackBar) {
  let userId = this.dataService.getUserInfo()!.id;
  dataService.getOrdersOfUser(userId).subscribe({
    next: (res: Order [])=> {
      this.pendingReturns = res.filter((o) => !o.returned);
        this.completedReturns = res.filter((o) => o.returned);
    }
  });
}

getFineToPay(order: Order){
  return this.dataService.getFine(order)
}

}

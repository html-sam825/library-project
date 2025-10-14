import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Order } from '../../service/models';

@Component({
  selector: 'app-return-book',
  standalone: false,
  templateUrl: './return-book.component.html',
  styleUrl: './return-book.component.scss'
})
export class ReturnBookComponent {
returnForm: FormGroup;
fineToPay: number | null = null;

constructor(fb: FormBuilder,
   private dataService: DataService, 
   private snackBar: MatSnackBar
  ) {
  this.returnForm = fb.group({
    bookId: fb.control(null, [Validators.required]),
    userId: fb.control(null, [Validators.required]),
    returnDate: fb.control(new Date(), [])
  });
}
   
getFine() {
  let userId = this.returnForm.get('userId')?.value;
  let bookId = this.returnForm.get('bookId')?.value;

  this.dataService.getOrdersOfUser(userId).subscribe({
    next:(res: Order[])=>{
      if(res.some(o =>!o.returned && o.bookId == bookId)) {
        let order:Order =res.filter((o)=> o.bookId == bookId)[0];
        this.fineToPay = this.dataService.getFine(order);
        
        } else {
          this.snackBar.open(`User doesn't have Book with ID: ${bookId}`, 'OK');
        }
      },
    }); 
  } 
returnBook(){
  let userId =this.returnForm.get('userId')?.value;
  let bookId = this.returnForm.get('bookId')?.value;

  this.dataService.returnBook(userId, bookId, this.fineToPay || 0).subscribe({
    next: (res) => {
      if (res === 'returned') {
        this.snackBar.open('Book returned successfully', 'OK');
      } else {
        this.snackBar.open('Error returning book', 'OK');
      }
    },
});

}
}




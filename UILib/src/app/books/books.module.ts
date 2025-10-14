import { NgModule } from '@angular/core';

import { VeiwBooksComponent } from './veiw-books/veiw-books.component';
import { BookStoreComponent } from './book-store/book-store.component';
import { SharedModule } from '../shared/shared.module';
import { MaintananceComponent } from './maintanance/maintanance.component';
import { ReturnBookComponent } from './return-book/return-book.component';
import { AddBooksComponent } from './add-books/add-books.component';



@NgModule({
  declarations: [
    VeiwBooksComponent,
    BookStoreComponent,
    MaintananceComponent,
    ReturnBookComponent,
    AddBooksComponent,
    AddBooksComponent
  ],
  imports: [
   SharedModule
  ]
})
export class BooksModule { }

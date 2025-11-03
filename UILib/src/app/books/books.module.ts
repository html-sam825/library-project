import { NgModule } from '@angular/core';

import { VeiwBooksComponent } from './veiw-books/veiw-books.component';
import { BookStoreComponent } from './book-store/book-store.component';
import { SharedModule } from '../shared/shared.module';
import { MaintananceComponent } from './maintanance/maintanance.component';
import { ReturnBookComponent } from './return-book/return-book.component';




@NgModule({
  declarations: [
    VeiwBooksComponent,
    BookStoreComponent,
    MaintananceComponent,
    ReturnBookComponent,
    
  ],
  imports: [
   SharedModule
  ]
})
export class BooksModule { }

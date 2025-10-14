import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Book, BookCategory } from '../../service/models';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface CategoryOption{
  displayValue: string;
  value:number;
}

@Component({
  selector: 'app-maintanance',
  standalone: false,
  templateUrl: './maintanance.component.html',
  styleUrl: './maintanance.component.scss'
})
export class MaintananceComponent {
newCategory: FormGroup;
newBook: FormGroup;
categoryOptions: CategoryOption[] = [];
deleteBook: FormControl;    

constructor(fb:FormBuilder, private dataService: DataService, private snackBar: MatSnackBar) {
  this.newCategory =fb.group({
    category: fb.control('', [Validators.required]),
    subCategory: fb.control('', [Validators.required]),
  });
  this.newBook = fb.group({
    title: fb.control("", [Validators.required]),
    author: fb.control("", [Validators.required]),
    price: fb.control(0, [Validators.required]),
    category: fb.control(-1, [Validators.required]),
});

dataService.getCategories().subscribe({
  next: (res: BookCategory[]) => {
    res.forEach(c   => {
      this.categoryOptions.push({
        value: c.id,
        displayValue: `${c.category} + / + ${c.subCategory}`
      });
    })
  }

})
  this.deleteBook = fb.control("", [Validators.required]);
}
addCategory(){
  let bookCategory: BookCategory ={
    id: 0,
    category: this.newCategory.get('category')?.value,
    subCategory: this.newCategory.get('subCategory')?.value
  };
  this.dataService.addNewCategory(bookCategory).subscribe({
    next: (res) => {
      if (res === 'cannot insert') {
        this.snackBar.open('Category already exists', 'OK');
    } else{
        this.snackBar.open('INSERTED', 'OK');
    }
    }
  });
}

 addNewBook() {
  let book: Book = {
      id: 0,
      title: this.newBook.get('title')?.value,
      author: this.newBook.get('author')?.value,
      bookCategoryId: this.newBook.get('category')?.value,
      price: this.newBook.get('price')?.value,
      bookCategory: {id: 0, category: '', subCategory: ''},
      ordered:false,
  };

  this.dataService.addBook(book).subscribe({
    next: (res) => {
      if(res === ' insert') {
        this.snackBar.open('Book Added', 'OK');
      }
    }
  });
    
  
}
deleteExistingBook() {
  let Id = this.deleteBook.value;
  this.dataService.deleteBook(Id).subscribe({
    next: (res) => {
      if(res === 'deleted') {
        this.snackBar.open('Book Deleted!', 'OK');
      } else {
        this.snackBar.open('Book does not Exist!', 'OK');
      }
    }
  });
}
}
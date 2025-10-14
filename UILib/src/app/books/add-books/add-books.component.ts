import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Book, BookCategory } from '../../service/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-books',
  standalone: false,
  templateUrl: './add-books.component.html',
  styleUrls: ['./add-books.component.scss'],
})
export class AddBooksComponent {
   bookForm!: FormGroup;
  loading = false;
  categories: BookCategory[] = [];

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.bookForm = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      categoryId: ['', Validators.required],
     
    });
    this.loadCategories();
  }
  loadCategories(){
    this.dataService.getCategories().subscribe({
     next: (res) =>{
      this.categories =res;
     },
     error:(err) => {
      console.error('Error loading categories:', err);
     }
    });
  }

  onSubmit(): void {
    if (this.bookForm.invalid) {
      this.snackBar.open('Please fill in all required fields.', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;

    const book: Book = {
      id: 0, // backend usually assigns this
      title: this.bookForm.value.title,
      author: this.bookForm.value.author,
      price: this.bookForm.value.price,
      bookCategoryId: this.bookForm.value.categoryId,
      ordered: false,
      bookCategory: {
        id: this.bookForm.value.categoryId,
        category: '',
        subCategory: '',
      },
    };

    this.dataService.addBook(book).subscribe({
      next: () => {
        this.snackBar.open('Book added successfully!', 'Close', { duration: 3000 });
        this.bookForm.reset();
        this.loading = false;
        this.router.navigate(['/book-store'])
      },
      error: (err) => {
        console.error('Error adding book:', err);
        this.snackBar.open('Failed to add book.', 'Close', { duration: 3000 });
        this.loading = false;
      },
    });
  }


}

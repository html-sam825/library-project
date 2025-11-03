import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Book, BookCategory } from '../../service/models';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

export interface CategoryOption {
  displayValue: string;
  value: number;
}

@Component({
  selector: 'maintanance',
  standalone: false,
  templateUrl: './maintanance.component.html',
  styleUrl: './maintanance.component.scss'
})
export class MaintananceComponent implements OnInit, OnDestroy {
  newCategory: FormGroup;
  newBook: FormGroup;
  categoryOptions: CategoryOption[] = [];
  deleteBook: FormControl;
  categories: BookCategory[] = [];
  loading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
   
    this.newCategory = this.fb.group({
      category: ['', [Validators.required, Validators.minLength(2)]],
      subCategory: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.newBook = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      author: ['', [Validators.required, Validators.minLength(2)]],
      price: [0, [Validators.required, Validators.min(0)]],
      category: [-1, [Validators.required, Validators.min(1)]],
    });

    this.deleteBook = this.fb.control('', [
      Validators.required, 
      Validators.pattern('^[0-9]+$')
    ]);
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.dataService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: BookCategory[]) => {
          this.categories = res;
          this.categoryOptions = res.map(c => ({
            value: c.id,
            displayValue: `${c.category} / ${c.subCategory}`
          }));
        },
        error: (err) => {
          console.error('Error loading categories:', err);
          this.showError('Failed to load categories');
        }
      });
  }

  addCategory(): void {
    if (this.newCategory.invalid) {
      this.markFormGroupTouched(this.newCategory);
      this.showError('Please fill in all category fields correctly');
      return;
    }

    const bookCategory: BookCategory = {
      id: 0,
      category: this.newCategory.get('category')?.value?.trim(),
      subCategory: this.newCategory.get('subCategory')?.value?.trim()
    };

    this.dataService.bookCategory(bookCategory)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res === 'cannot insert') {
            this.showError('Category already exists');
          } else {
            this.showSuccess('Category added successfully');
            this.newCategory.reset();
            this.loadCategories(); // Reload categories to include the new one
          }
        },
        error: (err) => {
          console.error('Error adding category:', err);
          this.showError('Failed to add category');
        }
      });
  }

  addNewBook(): void {
    if (this.newBook.invalid) {
      this.markFormGroupTouched(this.newBook);
      this.showError('Please fill in all book fields correctly');
      return;
    }

    this.loading = true;

    const book: Book = {
      id: 0,
      title: this.newBook.get('title')?.value?.trim(),
      author: this.newBook.get('author')?.value?.trim(),
      bookCategoryId: this.newBook.get('category')?.value,
      price: this.newBook.get('price')?.value,
      bookCategory: { id: 0, category: '', subCategory: '' },
      ordered: false,
    };

    this.dataService.addBook(book)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          console.log('Backend Response:', res);
          
          let parsedRes: any;
          try {
            parsedRes = typeof res === 'string' ? JSON.parse(res) : res;
          } catch (e) {
            console.error('Failed to parse backend response:', e);
            parsedRes = null;
          }

          if (parsedRes && parsedRes.id) {
            this.showSuccess('Book added successfully');
            this.newBook.reset({ category: -1, price: 0 });
          } else {
            console.warn('Unexpected backend response:', res);
            this.showError('Failed to add book - unexpected response');
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error adding book:', err);
          let errorMessage = 'Error adding book. Please try again.';
          
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.status === 400) {
            errorMessage = 'Invalid book data. Please check all fields.';
          }
          
          this.showError(errorMessage);
        }
      });
  }

  deleteExistingBook(): void {
    if (this.deleteBook.invalid) {
      this.showError('Please enter a valid book ID');
      return;
    }

    const bookId = parseInt(this.deleteBook.value, 10);
    
    if (isNaN(bookId) || bookId <= 0) {
      this.showError('Please enter a valid positive book ID');
      return;
    }

    
    if (!confirm(`Are you sure you want to delete book with ID: ${bookId}?`)) {
      return;
    }

    this.dataService.deleteBook(bookId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res === 'deleted') {
            this.showSuccess('Book deleted successfully');
            this.deleteBook.reset();
          } else {
            this.showError('Book does not exist');
          }
        },
        error: (err) => {
          console.error('Error deleting book:', err);
          this.showError('Failed to delete book');
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  
  get category() { return this.newCategory.get('category'); }
  get subCategory() { return this.newCategory.get('subCategory'); }
  get title() { return this.newBook.get('title'); }
  get author() { return this.newBook.get('author'); }
  get price() { return this.newBook.get('price'); }
  get categorySelect() { return this.newBook.get('category'); }

  trackByCategory(index: number, item: CategoryOption): number {
    return item.value;
  }
}
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { DataService } from '../../service/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'sign-up',
  standalone: false,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnDestroy {
  signupForm: FormGroup;
  hidePwdContent: boolean = true;
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // 
      userType: ['STUDENT', Validators.required], 
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$')
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      return null;
    }
  }

 signup() {
  console.log('Signup attempt:', this.signupForm.value);

  if (this.signupForm.invalid) {
    this.markFormGroupTouched();
    this.showError('Please fill in all fields correctly.');
    return;
  }

  const password = this.signupForm.get('password')?.value;
  const confirmPassword = this.signupForm.get('confirmPassword')?.value;
  
  if (password !== confirmPassword) {
    this.showError('Passwords do not match!');
    return;
  }

  this.isLoading = true;

  const userData = {
    firstName: this.signupForm.get('firstName')?.value?.trim(),
    lastName: this.signupForm.get('lastName')?.value?.trim(),
    email: this.signupForm.get('email')?.value?.trim().toLowerCase(),
    mobile_number: this.signupForm.get('mobileNumber')?.value,
    password: this.signupForm.get('password')?.value,
    userType: this.signupForm.get('userType')?.value,
    password_confirmation: this.signupForm.get('confirmPassword')?.value
  };

  console.log('Transformed data for backend:', userData);

  this.dataService.register(userData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.showSuccess(
          userData.userType === 'ADMIN' 
            ? 'Admin account created successfully!' 
            : 'Registration successful! Waiting for admin approval.'
        );

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        console.error('Signup error:', err);
        
        
        if (err.status === 422 && err.error?.errors) {
          console.log(' EXACT VALIDATION ERRORS FROM SERVER:', err.error.errors);
          
         
          Object.keys(err.error.errors).forEach(field => {
            console.log(`Field "${field}":`, err.error.errors[field]);
          });
          
          
          const validationErrors = err.error.errors;
          const errorMessages = this.extractValidationErrors(validationErrors);
          
          if (errorMessages.length > 0) {
            this.showError(errorMessages[0]);
          } else {
            this.showError('Validation failed. Please check your input.');
          }
        } else if (err.status === 400 && err.error?.message?.includes('email')) {
          this.showError('Email already exists. Please use a different email.');
        } else if (err.error?.message) {
          this.showError(err.error.message);
        } else {
          this.showError('Registration failed. Please try again.');
        }
        
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
}

  private extractValidationErrors(validationErrors: any): string[] {
    const errorMessages: string[] = [];
    
    Object.keys(validationErrors).forEach(field => {
      const errors = validationErrors[field];
      if (Array.isArray(errors) && errors.length > 0) {
        errorMessages.push(`${this.formatFieldName(field)}: ${errors[0]}`);
      } else if (typeof errors === 'string') {
        errorMessages.push(`${this.formatFieldName(field)}: ${errors}`);
      }
    });
    
    return errorMessages;
  }

  private formatFieldName(field: string): string {
    const fieldMap: { [key: string]: string } = {
      'firstName': 'First Name',
      'lastName': 'Last Name', 
      'email': 'Email',
      'mobileNumber': 'Mobile Number',
      'phone': 'Phone Number', 
      'password': 'Password',
      'userType': 'User Type',
      'password_confirmation': 'Confirm Password'
    };
    
    return fieldMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
     
  private markFormGroupTouched() {
    Object.keys(this.signupForm.controls).forEach(key => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'OK', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'OK', { 
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  
  get firstName() { return this.signupForm.get('firstName'); }
  get lastName() { return this.signupForm.get('lastName'); }
  get email() { return this.signupForm.get('email'); }
  get mobileNumber() { return this.signupForm.get('mobileNumber'); }
  get password() { return this.signupForm.get('password'); }
  get confirmPassword() { return this.signupForm.get('confirmPassword'); }
  get userType() { return this.signupForm.get('userType'); }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
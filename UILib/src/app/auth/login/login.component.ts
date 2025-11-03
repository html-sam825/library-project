import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../service/data.service';
import { UserType } from '../../service/models';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnDestroy {
  loginForm: FormGroup;
  hidePassword: boolean = true;
  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private router: Router 
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  login() {
    console.log('Login attempt:', this.loginForm.value);

    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      this.showError("Please fill in all fields correctly.");
      return;
    }

    this.isLoading = true;
    const loginInfo = this.loginForm.value;
    
    // Clear any existing tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');

    this.dataService.login(loginInfo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.log("Login successful response:", res);
          this.handleLoginResponse(res);
        },
        error: (err) => {
          console.error("Login error details:", err);
          this.handleLoginError(err);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  private handleLoginResponse(res: any) {
    if (res?.token && this.isValidJWT(res.token)) {
     
      localStorage.setItem('access_token', res.token);
      this.dataService.userStatus.next("loggedIn");
      
      
      if (res.user) {
        localStorage.setItem('user_info', JSON.stringify(res.user));
      }
      
      this.showSuccess("Login successful!");
      this.navigateBasedOnUserType();
    } else {
      console.warn('Unexpected response format:', res);
      this.showError("Unexpected response from server. Please try again.");
    }
  }

  private handleLoginError(err: any) {
    let errorMessage = "Login failed. Please try again.";
    
    if (err.status === 401) {
      errorMessage = "Invalid email or password. Please check your credentials.";
    } else if (err.status === 403) {
      if (err.error?.status === 'unapproved') {
        errorMessage = "Your account is not approved yet. Please wait for admin approval.";
      } else if (err.error?.status === 'blocked') {
        errorMessage = "Your account is blocked. Please contact the admin office.";
      } else {
        errorMessage = "Access denied. Please contact administrator.";
      }
    } else if (err.status === 0) {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (err.status === 500) {
      errorMessage = "Server error. Please try again later.";
    } else if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (err.error?.error) {
      errorMessage = err.error.error;
    }
    
    this.showError(errorMessage);
    this.isLoading = false;
  }

  private navigateBasedOnUserType() {
    const user = this.dataService.getUserInfo();
    console.log("Decoded user info:", user);

    if (user?.userType === UserType.ADMIN || user?.userType === UserType.STUDENT) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/login']);
      this.showError("Invalid user type. Please contact administrator.");
    }
  }

  private isValidJWT(token: string): boolean {
    try {
      if (typeof token !== 'string' || token.split('.').length !== 3) {
        return false;
      }
      
    
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
     
      if (payload.exp && payload.exp < currentTime) {
        this.showError("Your session has expired. Please login again.");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('JWT validation error:', error);
      return false;
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
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

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
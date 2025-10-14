import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../service/data.service';

import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: false,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent {
  signupForm: FormGroup;
  hidePwdContent:boolean =true;

  constructor(private fb: FormBuilder,
    private dataService: DataService,
    private snackBar: MatSnackBar,
      private router: Router ,
  ) {
    this.signupForm = this.fb.group({
      firstName: this.fb.control('', Validators.required),
      lastName: this.fb.control('', Validators.required),
      email: this.fb.control('', [Validators.required, Validators.email]),
      mobileNumber:this.fb.control('', [Validators.required]),
      password: this.fb.control('', Validators.required),
      userType: this.fb.control('', Validators.required),

      confirmPassword: this.fb.control('', Validators.required)
    });
  }
 signup() {

  console.log(this.signupForm.value);

  const password = this.signupForm.get('password')?.value;
  const confirmPassword = this.signupForm.get('confirmPassword')?.value;
  if (password !== confirmPassword) {
    this.snackBar.open('Passwords do not match!', 'OK', { duration: 3000 });
    return; 
  }

  let User  = {
    firstName: this.signupForm.get('firstName')?.value,
    lastName: this.signupForm.get('lastName')?.value,
    email: this.signupForm.get('email')?.value,
    mobileNumber: this.signupForm.get('mobileNumber')?.value,
    password: this.signupForm.get('password')?.value,
    userType: this.signupForm.get('userType')?.value,
    confirmPassword: this.signupForm.get('confirmPassword')?.value
  };

  this.dataService.register(User).subscribe({
    next: (res) => {
      this.snackBar.open('Registration successful!', 'OK', { duration: 3000 });

      // Navigate to login after short delay
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);
    },
    error: (err) => {
      console.error('Signup error:', err);
      this.snackBar.open('Registration failed. Please try again.', 'OK', { duration: 3000 });
    }
  });
}

} 

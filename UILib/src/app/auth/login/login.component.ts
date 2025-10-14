import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../../service/data.service';
import { UserType } from '../../service/models';
import { Router } from '@angular/router';


@Component({
  selector: 'login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword: boolean = true;
 

  constructor(
    fb: FormBuilder,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private router: Router 
  ) {
    this.loginForm = fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

login() {
  console.log(this.loginForm.value);

  if (this.loginForm.invalid) {
    this.snackBar.open("Please fill in all fields.", "OK");
    return;
  }

  const loginInfo = this.loginForm.value;
  localStorage.removeItem('access_token');

  this.dataService.login(loginInfo).subscribe({
    next: res => {
      console.log("Login response:", res);

      if (res?.status === 'not found') {
        this.snackBar.open("Credentials are invalid.", "OK");
      } else if (res?.status === 'unapproved') {
        this.snackBar.open("Your account is not approved yet.", "OK");
      } else if (res?.status === 'blocked') {
        this.snackBar.open("Your account is BLOCKED. Please go to the admin office to unblock.", "OK");
      } 
     
      else if (res?.token && typeof res.token === 'string' && res.token.split('.').length === 3) {
        localStorage.setItem('access_token', res.token);
        this.dataService.userStatus.next("loggedIn");
        this.snackBar.open("Login successful.", "OK");

        
        const user = this.dataService.getUserInfo();
        console.log("Decoded user info:", user); 
        if (user?.userType === UserType.ADMIN) {
          this.router.navigateByUrl('/home');
        } else if (user?.userType === UserType.STUDENT) {
          this.router.navigateByUrl('/home');
        } else {
          this.router.navigateByUrl('/login');
        }
      } else {
        this.snackBar.open("Unexpected or invalid token from server.", "OK");
      }
    },
    error: err => {
      console.error("Login error:", err);
      this.snackBar.open("Server error. Try again later.", "OK");
    }
  });
}


}

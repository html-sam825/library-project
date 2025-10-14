import { NgModule } from '@angular/core';

import { SignUpComponent } from './sign-up/sign-up.component';
import { LoginComponent } from './login/login.component';
import { SharedModule } from '../shared/shared.module';
import { MaterialModule } from '../material/material.module';



@NgModule({
  declarations: [
    SignUpComponent,
    LoginComponent
  ],
  imports: [
    SharedModule, MaterialModule
  ]
})
export class AuthModule { }

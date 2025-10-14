import { Routes } from '@angular/router';
import { PageNotFoundComponent } from './shared/page-not-found/page-not-found.component';
import { SignUpComponent } from './auth/sign-up/sign-up.component';
import { LoginComponent } from './auth/login/login.component';
import { BookStoreComponent } from './books/book-store/book-store.component';
import { UserOrdersComponent } from './users/user-orders/user-orders.component';
import { ProfileComponent } from './users/profile/profile.component';
import { MaintananceComponent } from './books/maintanance/maintanance.component';
import { ReturnBookComponent } from './books/return-book/return-book.component';
import { ApprovalRequestsComponent } from './users/approval-requests/approval-requests.component';
import { AllOrdersComponent } from './users/all-orders/all-orders.component';
import { VeiwBooksComponent } from './books/veiw-books/veiw-books.component';
import { AddBooksComponent } from './books/add-books/add-books.component';



export const routes: Routes = [
  {path: 'sign-up', component: SignUpComponent},
  {path:'', component: LoginComponent},
   {path: "home", component: BookStoreComponent},
   {path : "my-orders", component: UserOrdersComponent},
   {path: "profile", component: ProfileComponent},
   {path: "maintanance", component: MaintananceComponent},
   {path: "ReturnBook", component: ReturnBookComponent},
   {path: "approval-reguests", component: ApprovalRequestsComponent},
   {path: "all-orders", component:AllOrdersComponent },
  {path: 'add-books', component: AddBooksComponent},
   {path: "view-users", component: VeiwBooksComponent},
   { path: "page-not-found", component: PageNotFoundComponent }


];

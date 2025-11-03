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
import { ViewUsersComponent } from './users/view-users/view-users.component';
import { AdminDashboardComponent } from './users/admin-dashboard/admin-dashboard.component';
import { OrderApprovalsComponent } from './users/order-approvals/order-approvals.component';
import { StudentDashboardComponent } from './users/student-dashboard/student-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'sign-up', component: SignUpComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: BookStoreComponent }, 
  { path: 'book-store', component: BookStoreComponent },
  { path: 'my-orders', component: UserOrdersComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'maintanance', component: MaintananceComponent },
  { path: 'return-book', component: ReturnBookComponent },
  { path: 'approval-requests', component: ApprovalRequestsComponent },
  { path: 'all-orders', component: AllOrdersComponent },
  { path: 'view-users', component: ViewUsersComponent },
  { path: 'order-approvals', component: OrderApprovalsComponent },
  { path: 'view-books', component: VeiwBooksComponent },
  { path: 'page-not-found', component: PageNotFoundComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'student-dashboard', component: StudentDashboardComponent },
  { path: 'admin', redirectTo: '/admin-dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/page-not-found' } 
];
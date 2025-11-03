import { NgModule } from '@angular/core';

import { UserOrdersComponent } from './user-orders/user-orders.component';
import { SharedModule } from '../shared/shared.module';
import { ProfileComponent } from './profile/profile.component';
import { ApprovalRequestsComponent } from './approval-requests/approval-requests.component';
import { AllOrdersComponent } from './all-orders/all-orders.component';
import { ViewUsersComponent } from './view-users/view-users.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { OrderApprovalsComponent } from './order-approvals/order-approvals.component';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard.component';



@NgModule({
  declarations: [
    UserOrdersComponent,
    ProfileComponent,
    ApprovalRequestsComponent,
    AllOrdersComponent,
    AdminDashboardComponent,
    ViewUsersComponent,
    OrderApprovalsComponent,
    StudentDashboardComponent,

  ],
  imports: [
   SharedModule,

  ]
})
export class UsersModule { }

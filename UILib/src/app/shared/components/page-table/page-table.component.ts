import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AccountStatus, Order, User, UserType } from '../../../service/models';
import { DataService } from '../../../service/data.service';

@Component({
  selector: 'page-table',
  standalone: false,
  templateUrl: './page-table.component.html',
  styleUrls: ['./page-table.component.scss'],
})
export class PageTableComponent {
  @Input() columns: string[] = ['userId', 'userName'];
  @Input() dataSource: any[] = [];
  @Input() tableType: 'users' | 'orders' = 'users'; 

  @Output() approve = new EventEmitter<User>();
  @Output() unblock = new EventEmitter<User>();
  @Output() block = new EventEmitter<User>(); 
  @Output() orderAction = new EventEmitter<Order>();
  @Output() approveOrder = new EventEmitter<Order>();
  @Output() rejectOrder = new EventEmitter<Order>();


  constructor(private dataService: DataService) {}

 
  onApprove(user: User) {
    console.log('Approve button clicked in page-table:', user);
    this.approve.emit(user);
  }

  onUnblock(user: User) {
    console.log('Unblock button clicked in page-table:', user);
    this.unblock.emit(user);
  }

  
  onBlock(user: User) {
    console.log('Block button clicked in page-table:', user);
    this.block.emit(user);
  }

  onOrderAction(order: Order) {
    console.log('Order action clicked:', order);
    this.orderAction.emit(order);
  }

 
  getUserType(user: User): string {
    return UserType[user.userType] || 'Unknown';
  }

  getAccountStatus(input: AccountStatus): string {
    return AccountStatus[input] || 'Unknown';
  }

  isUserBlocked(user: User): boolean {
    return user.accountStatus === AccountStatus.BLOCKED;
  }

  needsApproval(user: User): boolean {
    return user.accountStatus === AccountStatus.UNAPPROVED;
  }

 
  canBlock(user: User): boolean {
    return user.accountStatus === AccountStatus.APPROVED;
  }

  canUnblock(user: User): boolean {
    return user.accountStatus === AccountStatus.BLOCKED;
  }

  isUserActive(user: User): boolean {
    return user.accountStatus === AccountStatus.APPROVED;
  }

 
  getFineToPay(order: Order): number {
    return this.dataService.getFine(order);
  }
  onApproveOrder(order: Order) {
  console.log('Approve order button clicked:', order);
  this.approveOrder.emit(order);
}

onRejectOrder(order: Order) {
  console.log('Reject order button clicked:', order);
  this.rejectOrder.emit(order);
}

canApproveOrder(order: Order): boolean {
  return !order.approved && !order.returned && this.tableType === 'orders';
}




  formatDate(date: any): string {
    if (!date) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) 
        ? 'Invalid Date' 
        : dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
    } catch {
      return 'Invalid Date';
    }
  }

  safeDisplay(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (value === '') return 'Empty';
    return String(value);
  }

  trackById(index: number, item: any): any {
    return item.id || index;
  }

  
  getStatusClass(status: AccountStatus): string {
    switch (status) {
      case AccountStatus.APPROVED:
        return 'status-badge approved';
      case AccountStatus.BLOCKED:
        return 'status-badge blocked';
      case AccountStatus.UNAPPROVED:
        return 'status-badge pending';
      default:
        return 'status-badge unknown';
    }
  }

  getOrderStatusText(order: Order): string {
  if (order.returned) {
    return 'Returned';
  } else if (order.fine_amount && order.fine_amount > 0) {
    return 'Overdue';
  } else if (order.approved_at) {
    return 'Approved';
  } else {
    return 'Pending';
  }
}

getOrderStatusClass(order: Order): string {
  if (order.returned) {
    return 'returned';
  } else if (order.fine_amount && order.fine_amount > 0) {
    return 'unpaid';
  } else if (order.approved_at) {
    return 'approved';
  } else {
    return 'pending';
  }
}

  
  shouldShowColumn(column: string): boolean {
    return this.columns.includes(column);
  }
}
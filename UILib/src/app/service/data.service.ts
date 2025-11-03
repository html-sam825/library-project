import { HttpClient, HttpHeaders, HttpParams,  HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { forkJoin, map, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AccountStatus, Book, BookCategory, Order, User, UserType } from './models';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar'; 

@Injectable({
  providedIn: 'root'
})
export class DataService {
  baseUrl: string = "http://127.0.0.1:8080/api/";
  userStatus: Subject<string> = new Subject();

  constructor(
    private http: HttpClient,
    private jwt: JwtHelperService,
    private router: Router,
      private snackBar: MatSnackBar
  ) { }

 register(userData: any): Observable<any> {
  console.log(' Sending to backend API:', JSON.stringify(userData, null, 2));
  
  return this.http.post(`${this.baseUrl}signup`, userData).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(' Full error response:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error,
        validationErrors: error.error?.errors
      });
      return throwError(() => error);
    })
  );
}

  login(loginInfo: any) {
    console.log('Sending login request:', loginInfo);
    
    return this.http.post<any>(`${this.baseUrl}login`, loginInfo, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).pipe(
      tap(response => {
        console.log('Login response:', response);
     
        if (response.status === 'success' && response.token) {
          localStorage.setItem('access_token', response.token);
          this.userStatus.next('LoggedIn');
        }
      }),
      catchError(error => {
        console.error('Login error details:', error);
        return throwError(() => error);
      })
    );
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('access_token');
    return !!(token && !this.jwt.isTokenExpired(token));
  }


 getOrders(): Observable<Order[]> {
  try {
    const headers = this.getHeaders();
    
    return this.http.get<any[]>(`${this.baseUrl}orders`, { headers }).pipe(
      map(orders => orders.map(order => this.mapOrder(order))),
      catchError((error: any) => {
        console.error('Error fetching orders:', error);
        if (error.status === 401) {
          this.handleUnauthorizedError();
        }
        return of([]);
      })
    );
  } catch (error) {
    console.error('Failed to prepare orders request:', error);
    return of([]);
  }
}

 private mapOrder(order: any): Order {
  const mappedOrder: Order = {
    id: order.id,
    userId: order.userId,
    userName: order.userName || (order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Unknown User'),
    bookId: order.bookId,
    bookTitle: order.bookTitle || (order.book ? order.book.title : 'Unknown Book'),
    orderDate: order.orderDate,
    returnDate: order.returnDate,
    finePaid: order.finePaid || 0,
    returned: order.returned || false
  };
  if ('status' in order) {
    (mappedOrder as any).status = order.status;
  }

  return mappedOrder;
}

  getUserInfo(): User | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const decodedToken: any = this.jwt.decodeToken(token);
      if (!decodedToken) return null;

      console.log('Decoded Token:', decodedToken);

      let accountStatus: AccountStatus;
      switch (decodedToken.accountStatus?.toUpperCase()) {
        case 'APPROVED':
          accountStatus = AccountStatus.APPROVED;
          break;
        case 'BLOCKED':
          accountStatus = AccountStatus.BLOCKED;
          break;
        case 'UNAPPROVED':
          accountStatus = AccountStatus.UNAPPROVED;
          break;
        default:
          accountStatus = AccountStatus.UNAPPROVED;
      }

      let userType: UserType;
      switch (decodedToken.userType?.toUpperCase()) {
        case 'ADMIN':
          userType = UserType.ADMIN;
          break;
        case 'STUDENT':
          userType = UserType.STUDENT;
          break;
        default:
          userType = UserType.STUDENT;
      }

      const user: User = {
        id: decodedToken.id,
        firstName: decodedToken.firstName || '',
        lastName: decodedToken.lastName || '',
        email: decodedToken.email || '',
        mobileNumber: decodedToken.mobileNumber || '',
        userType: userType,
        accountStatus: accountStatus,
        createdOn: decodedToken.createdOn || new Date().toISOString(),
        password: '' 
      };

      return user;
    } catch (err) {
      console.error('Error decoding token:', err);
      return null;
    }
  }

  logOut() {
    localStorage.removeItem('access_token');
    this.userStatus.next('LoggedOff');
    this.router.navigate(['/login']);
  }

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.baseUrl + 'book');
  }

  orderBook(book: Book): Observable<any> {
  console.log('=== ORDER BOOK SERVICE DEBUG ===');
  
  const user = this.getUserInfo();
  if (!user) {
    console.error('No user found when trying to order book');
    return throwError(() => new Error('User not logged in'));
  }

  console.log('User ordering book:', user);
  console.log('Book to order:', book);

  const token = localStorage.getItem('access_token');
  console.log('Token exists:', !!token);
  
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const orderData = {
    userId: user.id,
    bookId: book.id,
  
    userEmail: user.email,
    bookTitle: book.title
  };

  console.log('Order data being sent:', orderData);
  console.log('Full API URL:', `${this.baseUrl}orders`);

  return this.http.post(`${this.baseUrl}orders`, orderData, { headers })
    .pipe(
      tap(response => {
        console.log('Order API response:', response);
      }),
      catchError(error => {
        console.error('Order API error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        return throwError(() => error);
      })
    );
}
getUserOrdersWithBooks(userId: number): Observable<any[]> {
  console.log(' Getting user orders with book details for user:', userId);
  
  try {
    const headers = this.getHeaders();
    
    return this.http.get<any>(`${this.baseUrl}orders/user-orders/${userId}`, { headers }).pipe(
      tap(response => {
        console.log('User orders with books response:', response);
      }),
      map(response => {
        if (Array.isArray(response)) {
          return response;
        } else {
          console.warn('Unexpected user orders response format');
          return [];
        }
      }),
      catchError(error => {
        console.error(' Error fetching user orders with books:', error);
        return of([]);
      })
    );
  } catch (error) {
    console.error(' Failed to prepare user orders request:', error);
    return of([]);
  }
}

 getOrdersOfUser(userId: number): Observable<Order[]> {
  const headers = this.getHeaders();
  return this.http.get<any[]>(`${this.baseUrl}orders/user-orders/${userId}`, { headers }).pipe(
    map(orders => orders.map(order => this.mapOrder(order)))
  );
}

  getUnapprovedUsers(): Observable<User[]> {
    const headers = this.getHeaders();
    return this.http.get<User[]>(`${this.baseUrl}users/unapproved`);
  }

 getFine(order: Order): number {
  if (!order.orderDate) return 0;
  
  const today = new Date();
  const orderDate = new Date(order.orderDate);
  const dueDate = new Date(orderDate);
  dueDate.setDate(dueDate.getDate() + 10);
  
  if (dueDate.getTime() < today.getTime()) {
    const diff = today.getTime() - dueDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days * 5;
  }
  return 0;
}

  bookCategory(category: BookCategory): Observable<any> {
    return this.http.post(this.baseUrl + 'bookCategory', category);
  }

  getCategories(): Observable<BookCategory[]> {
    return this.http.get<BookCategory[]>(this.baseUrl + 'bookCategory');
  }

  addBook(book: Book): Observable<any> {
    return this.http.post(this.baseUrl + 'book', book);
  }

  deleteBook(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}book/${id}`);
  }

  returnBook(userId: string, bookId: string, fine: number): Observable<any> {
    const returnData = {
      userId: userId,
      bookId: bookId,
      fine: fine
    };

    return this.http.post(`${this.baseUrl}orders/return`, returnData);
  }


returnBookByOrderId(orderId: number, finePaid: boolean = false): Observable<any> {
  console.log(' Returning book by order ID:', orderId, 'Fine paid:', finePaid);
  
  const headers = this.getHeaders();
  
  const returnData = {
    orderId: orderId,
    finePaid: finePaid
  };

  return this.http.post(`${this.baseUrl}orders/return`, returnData, { headers })
    .pipe(
      tap(response => {
        console.log(' Book return successful:', response);
      }),
      catchError(error => {
        console.error(' Error returning book:', error);
        return throwError(() => error);
      })
    );
}

getUsers(): Observable<User[]> {
  console.log('Fetching users with auth...');
  
  try {
    const headers = this.getHeaders();
    
    return this.http.get<any>(`${this.baseUrl}users`, { headers }).pipe(
      tap(response => {
        console.log('Raw users API response:', response);
      }),
      map(response => {
      
        let usersArray: User[] = [];
        
        if (Array.isArray(response)) {
          usersArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          usersArray = response.data;
        } else if (response.users && Array.isArray(response.users)) {
          usersArray = response.users;
        } else if (response.result && Array.isArray(response.result)) {
          usersArray = response.result;
        } else {
          console.warn('Unexpected users response format, returning empty array');
          return [];
        }
        
        console.log('Processed users array:', usersArray.length);
        return usersArray;
      }),
      catchError(error => {
        console.error('Error fetching users:', error);
        
        if (error.status === 401) {
          console.error('UNAUTHORIZED - Token might be invalid or expired');
          this.handleUnauthorizedError();
        }
        
        return throwError(() => error);
      })
    );
  } catch (error) {
    console.error('Failed to prepare users request:', error);
    return throwError(() => error);
  }
}

getPendingOrders(): Observable<Order[]> {
  console.log('Fetching pending orders...');
  
  try {
    const headers = this.getHeaders();
    
    return this.http.get<any>(`${this.baseUrl}orders/pending`, { headers }).pipe(
      tap(response => {
        console.log('Raw pending orders response:', response);
      }),
      map(response => {
        
        let ordersArray: Order[] = [];
        
        if (Array.isArray(response)) {
          ordersArray = response.map(order => this.mapOrder(order));
        } else if (response.data && Array.isArray(response.data)) {
          ordersArray = response.data.map((order: any) => this.mapOrder(order));
        } else if (response.orders && Array.isArray(response.orders)) {
          ordersArray = response.orders.map((order: any) => this.mapOrder(order));
        } else {
          console.warn('Unexpected pending orders response format');
          return [];
        }
        
        console.log('Processed pending orders:', ordersArray.length);
        return ordersArray;
      }),
      catchError(error => {
        console.error('Error fetching pending orders:', error);
        
        if (error.status === 401) {
          this.handleUnauthorizedError();
        }
        
        return throwError(() => error);
      })
    );
  } catch (error) {
    console.error('Failed to prepare pending orders request:', error);
    return throwError(() => error);
  }
}

approveOrder(orderId: number): Observable<any> {
  console.log('DataService: Approving order ID:', orderId);
  
  try {
    const headers = this.getHeaders();
    
    const endpoints = [
      `${this.baseUrl}orders/approve/${orderId}`,
      `${this.baseUrl}orders/${orderId}/approve`,
      `${this.baseUrl}approve-order/${orderId}`
    ];

    console.log('Trying endpoint:', endpoints[0]);
    
    return this.http.put(endpoints[0], {}, { headers }).pipe(
      tap(response => {
        console.log('Approve order API response:', response);
      }),
      catchError(error => {
        console.error('Approve order API error:', error);
        
        if (error.status === 401) {
          this.handleUnauthorizedError();
        }
        
        return throwError(() => error);
      })
    );
  } catch (error) {
    console.error('Failed to prepare approve order request:', error);
    return throwError(() => error);
  }
}


rejectOrder(orderId: number): Observable<any> {
  console.log('DataService: Rejecting order ID:', orderId);
  
  try {
    const headers = this.getHeaders();
    
   
    const url = `${this.baseUrl}orders/reject/${orderId}`;
    console.log('Reject order URL:', url);
    
   
    return this.http.put(url, {}, { headers }).pipe(
      tap(response => {
        console.log(' Reject order API response:', response);
      }),
      catchError(error => {
        console.error(' Reject order API error:', error);
        console.error('Error details:', error.error);
        
        if (error.status === 401) {
          this.handleUnauthorizedError();
        }
        
        return throwError(() => error);
      })
    );
  } catch (error) {
    console.error('Failed to prepare reject order request:', error);
    return throwError(() => error);
  }
}
approveUser(userId: number): Observable<any> {
  console.log('DataService: Approving user ID:', userId);
  
  try {
    const headers = this.getHeaders();
    
   
    return this.http.put(`${this.baseUrl}users/approve/${userId}`, {}, { headers })
      .pipe(
        tap(response => {
          console.log('Approve user API response:', response);
        }),
        catchError(error => {
          console.error('Approve user API error:', error);
          return throwError(() => error);
        })
      );
  } catch (error) {
    console.error('Failed to prepare approve user request:', error);
    return throwError(() => error);
  }
} 

 blockUser(userId: number): Observable<any> {
  return this.http.put<any>(`${this.baseUrl}users/block/${userId}`, {}).pipe(
    map(response => {
      if (response.status === 'success') {
        return response;
      } else {
        throw new Error(response.message || 'Failed to block user');
      }
    }),
    catchError(error => {
      console.error('Error blocking user:', error);
      return throwError(() => error);
    })
  );
}
private handleUnauthorizedError(): void {
  console.log('Handling unauthorized error...');
  
  
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_info');
  

  this.userStatus.next('loggedOff');
  
  
  
 
  this.snackBar.open('Session expired. Please log in again.', 'OK', {
    duration: 5000,
    panelClass: ['error-snackbar']
  });
}


getDashboardStats(): Observable<any> {
  console.log(' Fetching dashboard statistics...');
  
  try {
    const headers = this.getHeaders();
    
    
    return this.http.get<any>(`${this.baseUrl}dashboard/stats`, { headers }).pipe(
      tap(response => {
        console.log(' Raw dashboard stats response:', response);
      }),
      map(response => {
       
        if (response.status === 'success' && response.data) {
          return response.data;
        } else if (response.stats) {
          return response.stats;
        } else {
          console.warn(' Dashboard stats endpoint not available, calculating locally');
          return this.calculateStatsLocally();
        }
      }),
      catchError(error => {
        console.error(' Error fetching dashboard stats:', error);
        console.log(' Calculating stats locally due to API error');
        return this.calculateStatsLocally();
      })
    );
  } catch (error) {
    console.error(' Failed to prepare dashboard stats request:', error);
    return this.calculateStatsLocally();
  }
}

private calculateStatsLocally(): Observable<any> {
  return new Observable(observer => {
    forkJoin({
      books: this.getBooks(),
      users: this.getUsers(),
      unapprovedUsers: this.getUnapprovedUsers(),
      orders: this.getOrders()
    }).subscribe({
      next: ({ books, users, unapprovedUsers, orders }) => {
        const stats = {
          totalBooks: books?.length || 0,
          activeUsers: users?.filter((user: any) => 
            user.accountStatus === 'APPROVED'
          ).length || 0,
          pendingApprovals: unapprovedUsers?.length || 0,
          activeOrders: orders?.filter((order: any) => 
            !order.returned
          ).length || 0,
          booksAddedThisMonth: 0,
          newUsersThisWeek: 0,   
          overdueOrders: orders?.filter((order: any) => {
            if (order.returned) return false;
            if (!order.returnDate) return false;
            const returnDate = new Date(order.returnDate);
            return returnDate < new Date();
          }).length || 0
        };
        
        console.log('Calculated local stats:', stats);
        observer.next(stats);
        observer.complete();
      },
      error: (error) => {
        console.error(' Error calculating local stats:', error);
        const defaultStats = {
          totalBooks: 0,
          activeUsers: 0,
          pendingApprovals: 0,
          activeOrders: 0,
          booksAddedThisMonth: 0,
          newUsersThisWeek: 0,
          overdueOrders: 0
        };
        observer.next(defaultStats);
        observer.complete();
      }
    });
  });
}
getRecentActivities(): Observable<any[]> {
  console.log('Fetching recent activities...');
  
  try {
    const headers = this.getHeaders();
    
    return this.http.get<any>(`${this.baseUrl}dashboard/activities`, { headers }).pipe(
      tap(response => {
        console.log('Raw activities response:', response);
      }),
      map(response => {
        
        let activitiesArray: any[] = [];
        
        if (Array.isArray(response)) {
          activitiesArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          activitiesArray = response.data;
        } else if (response.activities && Array.isArray(response.activities)) {
          activitiesArray = response.activities;
        } else if (response.result && Array.isArray(response.result)) {
          activitiesArray = response.result;
        } else {
          console.warn('Unexpected activities response format, returning empty array');
          return [];
        }
        
        console.log('Processed activities:', activitiesArray.length);
        return activitiesArray.slice(0, 6); 
      }),
      catchError(error => {
        console.error('Error fetching recent activities:', error);
        return of([]);
      })
    );
  } catch (error) {
    console.error('Failed to prepare activities request:', error);
    return of([]);
  }
}

getPendingApprovals(): Observable<any[]> {
  console.log(' Fetching pending approvals...');
  
  try {
    const headers = this.getHeaders();
    
    return this.http.get<any>(`${this.baseUrl}users/unapproved`, { headers }).pipe(
      tap(response => {
        console.log(' Raw pending approvals response:', response);
      }),
      map(response => {
        
         if (Array.isArray(response)) {
          return response;
        } else if (response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (response.users && Array.isArray(response.users)) {
          return response.users;
        } else {
          console.warn(' Unexpected pending approvals response format');
          return [];
        }
      }),
      catchError(error => {
        console.error(' Error fetching pending approvals:', error);
        return of([]);
      })
    );
  } catch (error) {
    console.error(' Failed to prepare pending approvals request:', error);
    return of([]);
  }
}

getAdminProfile(): Observable<any> {
  console.log(' Fetching admin profile...');
  
  try {
    const headers = this.getHeaders();
    
    return this.http.get<any>(`${this.baseUrl}admin/profile`, { headers }).pipe(
      tap(response => {
        console.log(' Raw admin profile response:', response);
      }),
      map(response => {
        
        if (response.status === 'success' && response.data) {
          return response.data;
        } else {
          console.warn('Unexpected admin profile response format');
         
          const currentUser = this.getUserInfo();
          return {
            fullName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Administrator',
            email: currentUser?.email || '',
            role: 'Admin'
          };
        }
      }),
      catchError(error => {
        console.error(' Error fetching admin profile:', error);
        
        const currentUser = this.getUserInfo();
        return of({
          fullName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Administrator',
          email: currentUser?.email || '',
          role: 'Admin'
        });
      })
    );
  } catch (error) {
    console.error(' Failed to prepare admin profile request:', error);
    
    const currentUser = this.getUserInfo();
    return of({
      fullName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Administrator',
      email: currentUser?.email || '',
      role: 'Admin'
    });
  }
}

getSystemHealth(): Observable<any> {
  console.log(' Fetching system health...');
  
  try {
    const headers = this.getHeaders();
    
    return this.http.get<any>(`${this.baseUrl}system/health`, { headers }).pipe(
      tap(response => {
        console.log(' Raw system health response:', response);
      }),
      map(response => {
       
        if (response.status === 'success' && response.data) {
          return response.data;
        } else {
          console.warn('Unexpected system health response format');
          return {
            storageUsage: 0,
            serverStatus: 'unknown',
            databaseStatus: 'unknown',
            lastChecked: new Date().toISOString()
          };
        }
      }),
      catchError(error => {
        console.error(' Error fetching system health:', error);
        return of({
          storageUsage: 0,
          serverStatus: 'unknown',
          databaseStatus: 'unknown',
          lastChecked: new Date().toISOString()
        });
      })
    );
  } catch (error) {
    console.error(' Failed to prepare system health request:', error);
    return of({
      storageUsage: 0,
      serverStatus: 'unknown',
      databaseStatus: 'unknown',
      lastChecked: new Date().toISOString()
    });
  }
}

private handleApiError(method: string, error: any): Observable<never> {
  console.error(` ${method} API error:`, error);
  
  if (error.status === 401) {
    console.error(' Unauthorized - Token expired or invalid');
    this.handleUnauthorizedError();
  } else if (error.status === 404) {
    console.error(' Endpoint not found - Check API route');
  } else if (error.status === 405) {
    console.error(' Method not allowed - Check HTTP method (GET/POST/PUT/DELETE)');
  } else if (error.status === 422) {
    console.error(' Validation error - Check request data');
  }
  
  return throwError(() => error);
}



rejectUser(userId: number): Observable<any> {
  console.log('DataService: Rejecting user ID:', userId);
  
  try {
    const headers = this.getHeaders();
    
    const endpoints = [
      `${this.baseUrl}users/reject/${userId}`,
      `${this.baseUrl}users/${userId}/reject`,
      `${this.baseUrl}users/block/${userId}`
    ];

    console.log('Trying endpoint:', endpoints[0]);
    
    return this.http.post(endpoints[0], {}, { headers }).pipe(
      tap(response => {
        console.log('Reject user API response:', response);
      }),
      catchError(error => {
        console.error('Reject user API error:', error);
        return throwError(() => error);
      })
    );
  } catch (error) {
    console.error('Failed to prepare reject user request:', error);
    return throwError(() => error);
  }
}

  
  blockUsers(): Observable<any> {
    return this.http.post(`${this.baseUrl}users/block-overdue`, {});
  }

  unblockUser(userId: number): Observable<any> {
  return this.http.put<any>(`${this.baseUrl}users/unblock/${userId}`, {}).pipe(
    map(response => {
      if (response.status === 'success') {
        return response;
      } else {
        throw new Error(response.message || 'Failed to unblock user');
      }
    }),
    catchError(error => {
      console.error('Error unblocking user:', error);
      return throwError(() => error);
    })
  );
}
  addCategory(category: BookCategory): Observable<any> {
    return this.http.post(`${this.baseUrl}bookCategory`, category);
  }

  checkOverdueBooks(): Observable<any> {
    return this.http.get(`${this.baseUrl}orders/check-overdue`);
  }

  searchUsers(params: any): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}users/search`, { params });
  }

  searchOrders(params: any): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}orders/search`, { params });
  }

  getUserStats(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}users/stats/${userId}`);
  }

  sendEmail(): Observable<any> {
    return this.http.get(`${this.baseUrl}SendEmailForPendingReturns`);
  }

  private getHeaders(): HttpHeaders {
  const token = localStorage.getItem('access_token');
  
  console.log('=== AUTH HEADERS DEBUG ===');
  console.log('Token for request:', token ? 'Present' : 'MISSING');
  
  if (!token) {
    console.error('No authentication token found!');
   
    this.router.navigate(['/login']); 
  }
  
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
}

  
}
import {HttpClient, HttpParams } from '@angular/common/http';
import { Injectable,  } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { map, Observable, Subject } from 'rxjs';
import { AccountStatus, Book, BookCategory, Order, User, UserType } from './models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  baseUrl: string = "http://127.0.0.1:8080/api/";
  userStatus : Subject<string> = new Subject  ();
  


  constructor(
    private http: HttpClient,
     private jwt: JwtHelperService, 
    private router: Router,
  ) { }

  register(user: any) {
    return this.http.post(this.baseUrl + 'signup', user, {
      responseType: 'text',
    });
  }

 login(info: any) {
  return this.http.post<{ status?: string; token?: string }>(
    this.baseUrl + 'login',
    {
      email: info.email,
      password: info.password
    }
  );
}



  isLoggedIn(): boolean {
  const token = localStorage.getItem('access_token');
  if (token && !this.jwt.isTokenExpired(token)) {
    return true;
  }
  return false;
}

getUserInfo(): User | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const decodedToken: any = this.jwt.decodeToken(token);
    if (!decodedToken) return null;

    
    console.log('Decoded Token:', decodedToken);

    const user: User = {
      id: decodedToken.id,
      firstName: decodedToken.firstName,
      lastName: decodedToken.lastName,
      email: decodedToken.email,
      mobileNumber: decodedToken.mobileNumber,
      userType:
        decodedToken.userType?.toUpperCase() === 'ADMIN'
          ? UserType.ADMIN
          : UserType.STUDENT,
      accountStatus:
        decodedToken.accountStatus?.toUpperCase() === 'BLOCKED'
          ? AccountStatus.BLOCKED
          : decodedToken.accountStatus?.toUpperCase() === 'UNAPPROVED'
          ? AccountStatus.UNAPPROVED
          : AccountStatus.ACTIVE,
      createdOn: decodedToken.createdOn,
      password: '',
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
    this.router.navigate(['/login'])
  }
 getBooks(){
  return this.http.get<Book[]>(this.baseUrl + 'book');
 }
 orderBook(book: Book) {
    let userId = this.getUserInfo()!.id;
    let params = new HttpParams()
      .append('userId', userId)
      .append('bookId', book.id);

    return this.http.post(this.baseUrl + 'OrderBook', null, {
      params: params,
      responseType: 'text',
    });
  }
   getOrdersOfUser(userId: number) {
    let params = new HttpParams().append('userId', userId);
      return this.http
        .get<any>(this.baseUrl + 'GetOrdersOfUser', {
          params: params,
        })
        .pipe(
        map((orders) => {
          let newOrders = orders.map((order: any) => {
            let newOrder: Order = {
              id: order.id,
              userId: order.userId,
              userName: order.user.firstName + ' ' + order.user.lastName,
              bookId: order.bookId,
              bookTitle: order.book.title,
              orderDate: order.orderDate,
              returned: order.returned,
              returnDate: order.returnDate,
              finePaid: order.finePaid,
            };
            return newOrder;
          });
          return newOrders;
        })
      );
  }
getFine(order: Order){
  let today =new Date();
  let orderDate =new Date(Date.parse(order.orderDate));
  orderDate.setDate(orderDate.getDate() +10);
if (orderDate.getTime()< today.getTime()){
  var diff =today.getTime() -orderDate.getTime();
  let days= Math.floor(diff/1000*60*60*24);
  return days * 5;

}
  return 0;
}

addNewCategory(category: BookCategory) {
    return this.http.post(this.baseUrl + 'AddNewCategory', category, {
      responseType: 'text',
    });
  }

  getCategories() {
    return this.http.get<BookCategory[]>(this.baseUrl + 'bookCategory');
  }

  approveUser(userId: number): Observable<any> {
  return this.http.put(`${this.baseUrl}ApproveUser/${userId}`, {});
}

blockUser(userId: number): Observable<any> {
  return this.http.put(`${this.baseUrl}BlockUser/${userId}`, {});
}


  addBook(book: Book) {
    return this.http.post(this.baseUrl + 'book', book, {
      responseType: "text",
  });
}

deleteBook(id: number) {
    let params = new HttpParams().append('id', id);
    return this.http.delete(this.baseUrl + 'book', {
      params: params,
      responseType: 'text',
    });
  }

  returnBook(userId: string, bookId: string, fine: number) {
    let params = new HttpParams()
      .append('userId', userId)
      .append('bookId', bookId)
      .append('fine', fine);

    return this.http.post(this.baseUrl + 'book', null, {
      params: params,
      responseType: 'text',
    });
  }
    getUsers() {
    return this.http.get<User[]>(this.baseUrl + 'GetUsers');
  }

  approveRequest(userId: number) {
    return this.http.get(this.baseUrl + 'ApproveRequest', {
      params: new HttpParams().append('userId', userId),
      responseType: 'text',
    });
  }

  getOrders() {
    return this.http.get<any>(this.baseUrl + "GetOrders").pipe(
      map((orders) => {
        let newOrders = orders.map((order: any) => {
          let newOrder: Order = {
            id: order.id,
            userId: order.userId,
            userName: order.user.firstName + ' ' + order.user.lastName,
            bookId: order.bookId,
            bookTitle: order.book.title,
            orderDate: order.orderDate,
            returnDate: order.returnDate,
            finePaid: order.finePaid,
            returned: false
          };
          return newOrder;
        });
        return newOrders;


      })
    );
  }

  sendEmail(){
    return this.http.get(this.baseUrl + "SendEmailForPendingReturns", {
      responseType : "text",
    });
  }

  blockUsers(){
    return this.http.get(this.baseUrl + "BlockFineOverdueUsers", {
      responseType: "text",
    })
  }

  unblock(userId: number) {
    return this.http.get(this.baseUrl + "Unblock", {
      params: new HttpParams().append("userId", userId),
      responseType: "text",
    })
  }
}





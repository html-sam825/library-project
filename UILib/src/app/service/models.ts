export interface User {
  id: number;
  firstName: any;
  lastName: any;
  email: any;
  mobileNumber: any;
  password: any;
  userType: UserType;
  accountStatus: AccountStatus;
  createdOn: any;
}

export enum UserType {
  ADMIN,
  STUDENT,
}

export enum AccountStatus {
  ACTIVE,
  BLOCKED,
  UNAPPROVED,
}

export interface BookCategory {
  id: number;
  category: any;
  subCategory: any;
}

export interface Book {
  id: number;
  title: any;
  author: any;
  price: any;
  ordered: boolean;
  bookCategory: BookCategory;
  bookCategoryId: any;
}

export interface BooksByCategory {
  bookCategoryId: any;
  category: any;
  subCategory: any;
  books: Book[];
}

export interface Order{
  id : number;
  userId: number;
  userName: any;
  bookId: number;
  bookTitle: any; 
  orderDate: any;
  returned: boolean;
  returnDate: any;
  finePaid: number
}

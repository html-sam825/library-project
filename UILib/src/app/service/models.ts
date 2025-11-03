
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  userType: UserType;
  accountStatus: AccountStatus;
  createdOn: string;
  max_books_limit?: number; 
  can_borrow?: boolean;
}


export enum UserType {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
}

export enum AccountStatus {
  APPROVED = 'APPROVED', 
  BLOCKED = 'BLOCKED',
  UNAPPROVED = 'UNAPPROVED',
}

export interface BookCategory {
  id: number;
  category: string;
  subCategory: string;
}


export interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  bookCategory: BookCategory;
  bookCategoryId: number;
  ordered: boolean;
  orderStatus?: 'PENDING' | 'APPROVED' | 'RETURNED' | 'OVERDUE'| 'UNAVAILABLE' | 'REJECTED'; 
  orderedBy?: number; 
  orderDate?: string;
  returnDate?: string;
  approvedBy?: number; 
  approvedDate?: string;
}

export interface BooksByCategory {
  bookCategoryId: number;
  category: string;
  subCategory: string;
  books: Book[];
}


export interface Order {
  id: number;
  userId: number;
  userName: string;
  bookId: number;
  bookTitle: string;
  orderDate: string;
  returned: boolean;
  returnDate: string;
  finePaid: number;
  status?: string;
  approved_at?: string; 
  fine_amount?: number; 

  approved?: boolean;
  approvedBy?: number;
  approvedDate?: string;
  orderStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';

}
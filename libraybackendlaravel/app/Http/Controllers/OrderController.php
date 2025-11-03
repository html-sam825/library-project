<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\User;
use App\Models\Book; 
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use App\Mail\BookReturnReminder;
use App\Mail\AccountBlocked;

class OrderController extends Controller
{
    protected $order;   

    public function __construct()
    {
        $this->order = new Order();
    }

    public function index()
    {
        try {
            Log::info('Fetching orders');
            $orders = Order::with(['user', 'book'])->get();
            Log::info('Orders fetched successfully', ['count' => $orders->count()]);
            return $orders;
            
        } catch (\Exception $e) {
            Log::error('Error fetching orders: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $userId = $request->query('userId') ?? $request->input('userId');
            $bookId = $request->query('bookId') ?? $request->input('bookId');

            Log::info('Creating order', ['userId' => $userId, 'bookId' => $bookId]);

            if (!$userId || !$bookId) {
                return response()->json(['message' => 'Missing userId or bookId'], 400);
            }

            $user = User::find($userId);
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            if ($user->accountStatus !== 'APPROVED') {
                return response()->json([
                    'message' => 'Your account is not approved yet. Please wait for admin approval before ordering books.'
                ], 403);
            }

            if (!$user->can_borrow) {
                return response()->json([
                    'message' => 'Your account is blocked. Please contact admin.'
                ], 403);
            }

            $book = Book::find($bookId);
            if (!$book) {
                return response()->json(['message' => 'Book not found'], 404);
            }

            $existingOrder = Order::where('bookId', $bookId)
                ->where('status', 'APPROVED')
                ->whereNull('returned_at')
                ->first();
                
            if ($existingOrder) {
                return response()->json([
                    'message' => 'This book is currently borrowed by another student.'
                ], 400);
            }

            $currentOrders = Order::where('userId', $userId)
                ->where('status', 'APPROVED')
                ->whereNull('returned_at')
                ->count();
                
            if ($currentOrders >= $user->max_books_limit) {
                return response()->json([
                    'message' => 'You have reached the maximum limit of ' . $user->max_books_limit . ' books.'
                ], 400);
            }

            $existingUserOrder = Order::where('userId', $userId)
                ->where('bookId', $bookId)
                ->where('status', 'APPROVED')
                ->whereNull('returned_at')
                ->first();
                
            if ($existingUserOrder) {
                return response()->json([
                    'message' => 'You already have this book. Please return it first.'
                ], 400);
            }

            $order = new Order();
            $order->userId = $userId;
            $order->userName = $user->firstName . ' ' . $user->lastName;
            $order->bookId = $bookId;
            $order->bookTitle = $book->title;
            $order->orderDate = now();
            $order->status = 'PENDING'; 
            $order->returned = false;
            $order->finePaid = false;
            $order->fine_amount = 0;
            $order->save();

            Log::info('Order created successfully', ['orderId' => $order->id]);

            return response()->json([
                'message' => 'Book order submitted. Waiting for admin approval.',
                'data' => $order
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating order: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error creating order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getPendingOrders()
    {
        try {
            $orders = Order::where('status', 'PENDING')->with(['user', 'book'])->get();
            return response()->json($orders);
        } catch (\Exception $e) {
            Log::error('Error fetching pending orders: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pending orders'], 500);
        }
    }

    public function getOverdueOrders()
    {
        try {
            $orders = Order::where('status', 'APPROVED')
                ->whereNull('returned_at')
                ->get()
                ->filter(function ($order) {
                    return $this->calculateDaysOverdue($order->approved_at) > 0;
                });

            return response()->json($orders->values());
        } catch (\Exception $e) {
            Log::error('Error fetching overdue orders: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch overdue orders'], 500);
        }
    }

    public function approveOrder($orderId)
    {
        try {
            $order = Order::find($orderId);
            if (!$order) {
                return response()->json(['message' => 'Order not found'], 404);
            }

            $order->status = 'APPROVED';
            $order->approved_at = now();
            $order->save();

            Log::info('Order approved', ['orderId' => $orderId]);

            return response()->json([
                'message' => 'Order approved successfully',
                'order' => $order
            ]);

        } catch (\Exception $e) {
            Log::error('Error approving order: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to approve order'], 500);
        }
    }

public function returnBook(Request $request)
{
    try {
        $orderId = $request->input('orderId');
        $finePaid = $request->input('finePaid', false);

        $order = Order::find($orderId);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

       
        if (!$finePaid && $order->approved_at) {
            $daysOverdue = $this->calculateDaysOverdue($order->approved_at);
            $fine = min($daysOverdue * 50, 500);
            $order->fine_amount = $fine;
        }

        
        $order->status = 'RETURNED';
        $order->returned_at = now();
        $order->returned = true;
        $order->finePaid = $finePaid;
        $order->save();

        
        if ($finePaid) {
            $user = User::find($order->userId);
            $totalPendingFine = Order::where('userId', $user->id)
                ->where('finePaid', false)
                ->sum('fine_amount');
                
            if ($totalPendingFine == 0 && $user->accountStatus === 'BLOCKED') {
                $user->accountStatus = 'APPROVED';
                $user->can_borrow = true;
                $user->save();
                
                Log::info('User auto-unblocked after paying all fines', [
                    'userId' => $user->id,
                    'userEmail' => $user->email
                ]);
            }
        }

        Log::info('Book returned', [
            'orderId' => $orderId, 
            'finePaid' => $finePaid,
            'fineAmount' => $order->fine_amount
        ]);

        return response()->json([
            'message' => 'Book returned successfully',
            'order' => $order,
            'fine_paid' => $finePaid,
            'fine_amount' => $order->fine_amount
        ]);

    } catch (\Exception $e) {
        Log::error('Error returning book: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to return book'], 500);
    }
}

    public function checkOverdueBooks()
    {
        try {
            $overdueOrders = Order::where('status', 'APPROVED')
                ->whereNull('returned_at')
                ->get()
                ->filter(function ($order) {
                    return $this->calculateDaysOverdue($order->approved_at) > 0;
                });

            $blockedUsers = 0;

            foreach ($overdueOrders as $order) {
                $daysOverdue = $this->calculateDaysOverdue($order->approved_at);
                $fine = min($daysOverdue * 50, 500);
                
                $order->fine_amount = $fine;
                $order->save();

                
                $this->sendReturnReminderEmail($order, $fine);

                if ($fine >= 500) {
                    $user = User::find($order->userId);
                    $user->accountStatus = 'BLOCKED';
                    $user->can_borrow = false;
                    $user->save();
                    $blockedUsers++;

                    
                    $this->sendBlockedEmail($user, $order);
                }
            }

            Log::info('Overdue check completed', [
                'overdue_orders' => count($overdueOrders),
                'blocked_users' => $blockedUsers
            ]);

            return response()->json([
                'message' => 'Overdue check completed',
                'overdue_orders_count' => count($overdueOrders),
                'blocked_users_count' => $blockedUsers
            ]);

        } catch (\Exception $e) {
            Log::error('Error checking overdue books: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to check overdue books'], 500);
        }
    }

    public function searchOrders(Request $request)
{
    try {
        $query = Order::with(['user', 'book']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('userName', 'like', "%{$search}%")
                  ->orWhere('bookTitle', 'like', "%{$search}%")
                  ->orWhereHas('user', function($userQuery) use ($search) {
                      $userQuery->where('firstName', 'like', "%{$search}%")
                               ->orWhere('lastName', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('userType')) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('userType', $request->userType);
            });
        }

        if ($request->has('overdue')) {
            $query->where('status', 'APPROVED')
                  ->whereNull('returned_at')
                  ->where('approved_at', '<=', now()->subDays(10));
        }

        $perPage = $request->get('per_page', 15);
        $orders = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($orders);

    } catch (\Exception $e) {
        Log::error('Error searching orders: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to search orders'], 500);
    }
}

     public function getOrderStats()
{
    try {
        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'PENDING')->count();
        $approvedOrders = Order::where('status', 'APPROVED')->whereNull('returned_at')->count();
        $returnedOrders = Order::where('status', 'RETURNED')->count();
        
        $overdueOrders = Order::where('status', 'APPROVED')
            ->whereNull('returned_at')
            ->get()
            ->filter(function ($order) {
                return $this->calculateDaysOverdue($order->approved_at) > 0;
            })->count();

        $totalFines = Order::where('finePaid', false)->sum('fine_amount');

        return response()->json([
            'total_orders' => $totalOrders,
            'pending_orders' => $pendingOrders,
            'approved_orders' => $approvedOrders,
            'returned_orders' => $returnedOrders,
            'overdue_orders' => $overdueOrders,
            'total_unpaid_fines' => $totalFines
        ]);

    } catch (\Exception $e) {
        Log::error('Error fetching order stats: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch order statistics'], 500);
    }
}

public function getSystemHealth()
{
    try {
        $totalBooks = \App\Models\Book::count();
        $totalUsers = \App\Models\User::count();
        $totalOrders = \App\Models\Order::count();
        
        $storageUsage = min(100, ($totalBooks * 0.5) + ($totalUsers * 0.1) + ($totalOrders * 0.2));
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'storageUsage' => round($storageUsage, 2),
                'serverStatus' => 'online',
                'databaseStatus' => 'connected',
                'totalBooks' => $totalBooks,
                'totalUsers' => $totalUsers,
                'totalOrders' => $totalOrders,
                'lastChecked' => now()->toISOString()
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('Error fetching system health: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch system health'
        ], 500);
    }
}

public function bulkApproveOrders(Request $request)
{
    try {
        $orderIds = $request->input('order_ids', []);
        
        if (empty($orderIds)) {
            return response()->json(['message' => 'No orders selected'], 400);
        }

        $approvedCount = 0;
        foreach ($orderIds as $orderId) {
            $order = Order::find($orderId);
            if ($order && $order->status === 'PENDING') {
                $order->status = 'APPROVED';
                $order->approved_at = now();
                $order->save();
                $approvedCount++;
            }
        }

        Log::info('Bulk order approval completed', ['approved_count' => $approvedCount]);

        return response()->json([
            'message' => "Successfully approved {$approvedCount} orders",
            'approved_count' => $approvedCount
        ]);

    } catch (\Exception $e) {
        Log::error('Error in bulk approval: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to approve orders'], 500);
    }
}

    public function update(Request $request, string $id)
    {
        try {
            $order = $this->order->find($id);
            if (!$order) {
                return response()->json(['message' => 'Order not found'], 404);
            }

            $order->update($request->all());
            return response()->json($order);
            
        } catch (\Exception $e) {
            Log::error('Error updating order: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error updating order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id)
    {
        try {
            $order = $this->order->find($id);
            if (!$order) {
                return response()->json(['message' => 'Order not found'], 404);
            }

            $order->delete();
            return response()->json(['message' => 'Order deleted successfully']);
            
        } catch (\Exception $e) {
            Log::error('Error deleting order: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

   
    private function sendBlockedEmail($user, $order)
    {
        try {
            Mail::to($user->email)->send(new AccountBlocked($user, $order));
            Log::info('Blocked notification sent to: ' . $user->email);

        } catch (\Exception $e) {
            Log::error('Failed to send blocked notification: ' . $e->getMessage());
        }
    }

    private function sendReturnReminderEmail($order, $fine)
    {
        try {
            $daysOverdue = $this->calculateDaysOverdue($order->approved_at);
            
            Mail::to($order->user->email)->send(new BookReturnReminder($order, $fine, $daysOverdue));
            
            Log::info('Return reminder sent to: ' . $order->user->email);

        } catch (\Exception $e) {
            Log::error('Failed to send return reminder: ' . $e->getMessage());
        }
    }

   
    private function calculateDaysOverdue($approvedDate)
    {
        if (!$approvedDate) return 0;

        $dueDate = Carbon::parse($approvedDate)->addDays(10);
        $today = Carbon::now();

        if ($today->gt($dueDate)) {
            return $dueDate->diffInDays($today);
        }

        return 0;
    }

public function rejectOrder($orderId)
{
    try {
        \Log::info('=== REJECT ORDER METHOD CALLED ===', ['orderId' => $orderId]);
        
        $order = Order::find($orderId);
        
        if (!$order) {
            \Log::error('Order not found', ['orderId' => $orderId]);
            return response()->json([
                'status' => 'error',
                'message' => 'Order not found - ID: ' . $orderId
            ], 404);
        }

       
        $order->status = 'REJECTED';
        $saveResult = $order->save();

        \Log::info('Order rejected successfully', [
            'orderId' => $orderId,
            'saveResult' => $saveResult
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Order rejected successfully',
            'order_id' => $order->id
        ]);

    } catch (\Exception $e) {
        \Log::error('CRITICAL ERROR in rejectOrder: ' . $e->getMessage(), [
            'orderId' => $orderId,
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
        
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to reject order',
            'debug_error' => $e->getMessage(),
            'debug_file' => $e->getFile(),
            'debug_line' => $e->getLine()
        ], 500);
    }
}

    public function getUserOrders($userId)
    {
        try {
            $orders = Order::where('userId', $userId)
                ->with('book')
                ->orderBy('created_at', 'desc')
                ->get();
                
            return response()->json($orders);
        } catch (\Exception $e) {
            Log::error('Error fetching user orders: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch user orders'], 500);
        }
    }
}
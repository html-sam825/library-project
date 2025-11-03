<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\AccountApproved;

class UserController extends Controller
{
    public function index()
    {
        return User::all();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'firstName' => 'required|string',
            'lastName' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'mobileNumber' => 'nullable|string',
            'password' => 'required|string|min:6',
            'userType' => 'in:ADMIN,STUDENT',
            'accountStatus' => 'in:APPROVED,BLOCKED,UNAPPROVED',
        ]);

        $data['password'] = Hash::make($data['password']);
        
        $data['max_books_limit'] = 3;
        $data['can_borrow'] = $data['userType'] === 'ADMIN' ? true : false;
        $data['createdOn'] = now();

        return User::create($data);
    }

    public function show($id)
    {
        return User::findOrFail($id);
    }

    public function getUsers()
{
    try {
        $users = User::all();
        return response()->json([
            'status' => 'success',
            'users' => $users
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
}

     public function searchUsers(Request $request)
    {
        try {
            $query = User::query();
            
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('firstName', 'like', "%{$search}%")
                      ->orWhere('lastName', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }
            
            if ($request->has('userType')) {
                $query->where('userType', $request->userType);
            }
            
            if ($request->has('accountStatus')) {
                $query->where('accountStatus', $request->accountStatus);
            }

            $users = $query->get();
            return response()->json($users);
            
        } catch (\Exception $e) {
            Log::error('Error searching users: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search users'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $data = $request->validate([
        'firstName' => 'sometimes|string',
        'lastName' => 'sometimes|string',
        'email' => 'sometimes|email|unique:users,email,' . $id,
        'mobileNumber' => 'nullable|string',
        'userType' => 'sometimes|in:ADMIN,STUDENT',
        'accountStatus' => 'sometimes|in:APPROVED,BLOCKED,UNAPPROVED',
        'max_books_limit' => 'sometimes|integer|min:1',
    ]);

        $user->update($request->all());
        return $user;
    }

    public function destroy($id)
    {
        return User::destroy($id);
    }

    public function getUnapprovedUsers()
    {
        try {
            $users = User::where('accountStatus', 'UNAPPROVED')
                       ->where('userType', 'STUDENT')
                       ->get();
            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('Error fetching unapproved users: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch unapproved users'], 500);
        }
    }

    public function approveUser($userId)
    {
        try {
            $user = User::find($userId);
            
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            $user->accountStatus = 'APPROVED';
            $user->can_borrow = true;
            $user->save();

            
            $this->sendApprovalNotificationToUser($user);

            return response()->json([
                'message' => 'User approved successfully',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            Log::error('Error approving user: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to approve user'], 500);
        }
    }

    public function blockFineOverdueUsers(): JsonResponse
{
    try {
     
        return response()->json([
            'status' => 'success',
            'message' => 'Users with overdue fines blocked successfully'
        ]);
    } catch (\Exception $e) {
        \Log::error('Error blocking overdue users: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to block users with overdue fines'
        ], 500);
    }
}


public function unblockUserGet(Request $request): JsonResponse
{
    try {
        $userId = $request->query('userId');
        $user = User::findOrFail($userId);
        $user->accountStatus = 'APPROVED';
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'User unblocked successfully'
        ]);
    } catch (\Exception $e) {
        \Log::error('Error unblocking user: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to unblock user'
        ], 500);
    }
}



    public function blockUser($userId)
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            $user->accountStatus = 'BLOCKED';
            $user->can_borrow = false;
            $user->save();

            return response()->json([
                'message' => 'User blocked successfully',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            Log::error('Error blocking user: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to block user'], 500);
        }
    }

    

    public function unblockUser($userId)
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            $totalUnpaidFines = Order::where('userId', $userId)
                ->where('finePaid', false)
                ->sum('fine_amount');

            if ($totalUnpaidFines > 0) {
                return response()->json([
                    'message' => 'Cannot unblock user. Please pay all fines first.',
                    'total_fines' => $totalUnpaidFines
                ], 400);
            }

            $user->accountStatus = 'APPROVED';
            $user->can_borrow = true;
            $user->save();

            return response()->json([
                'message' => 'User unblocked successfully',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            Log::error('Error unblocking user: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to unblock user'], 500);
        }
    }

    public function getUserStats($userId)
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            $currentBooks = Order::where('userId', $userId)
                ->where('status', 'APPROVED')
                ->whereNull('returned_at')
                ->count();

            $totalFines = Order::where('userId', $userId)
                ->where('finePaid', false)
                ->sum('fine_amount');

            $pendingOrders = Order::where('userId', $userId)
                ->where('status', 'PENDING')
                ->count();

            return response()->json([
                'user' => $user,
                'stats' => [
                    'current_books' => $currentBooks,
                    'books_remaining' => $user->max_books_limit - $currentBooks,
                    'total_unpaid_fines' => $totalFines,
                    'pending_orders' => $pendingOrders,
                    'max_books_limit' => $user->max_books_limit
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting user stats: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to get user statistics'], 500);
        }
    }



    public function getStudents()
    {
        try {
            $students = User::where('userType', 'STUDENT')->get();
            return response()->json($students);
        } catch (\Exception $e) {
            Log::error('Error fetching students: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch students'], 500);
        }
    }

    public function getAdmins()
    {
        try {
            $admins = User::where('userType', 'ADMIN')->get();
            return response()->json($admins);
        } catch (\Exception $e) {
            Log::error('Error fetching admins: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch admins'], 500);
        }
    }

    public function getBlockedUsers()
    {
        try {
            $blockedUsers = User::where('accountStatus', 'BLOCKED')->get();
            return response()->json($blockedUsers);
        } catch (\Exception $e) {
            Log::error('Error fetching blocked users: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch blocked users'], 500);
        }
    }

  private function sendApprovalNotificationToUser(User $user)
{
    try {
        
        Mail::to($user->email)->send(new AccountApproved($user));
        
        Log::info('Approval notification sent to user: ' . $user->email);

    } catch (\Exception $e) {
        Log::error('Failed to send approval notification: ' . $e->getMessage());
    }
}

public function getDashboardStats()
{
    try {
      
        $totalBooks = \App\Models\Book::count();
        
       
        $activeUsers = User::where('accountStatus', 'APPROVED')->count();
        
        
        $pendingApprovals = User::where('accountStatus', 'UNAPPROVED')->count();
        
        
        $activeOrders = \App\Models\Order::where('status', 'APPROVED')
            ->whereNull('returned_at')
            ->count();
        
        
        $booksAddedThisMonth = \App\Models\Book::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        
       
        $newUsersThisWeek = User::where('created_at', '>=', now()->subWeek())->count();
        
        
        $overdueOrders = \App\Models\Order::where('status', 'APPROVED')
            ->whereNull('returned_at')
            ->where('approved_at', '<=', now()->subDays(10))
            ->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'totalBooks' => $totalBooks,
                'activeUsers' => $activeUsers,
                'pendingApprovals' => $pendingApprovals,
                'activeOrders' => $activeOrders,
                'booksAddedThisMonth' => $booksAddedThisMonth,
                'newUsersThisWeek' => $newUsersThisWeek,
                'overdueOrders' => $overdueOrders
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('Error fetching dashboard stats: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch dashboard statistics'
        ], 500);
    }
}

public function getRecentActivities()
{
    try {
        $activities = [];
        
        
        $recentOrders = \App\Models\Order::with('user', 'book')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
            
        foreach ($recentOrders as $order) {
            $activities[] = [
                'type' => 'order_placed',
                'description' => "New order: {$order->book->title} by {$order->user->firstName} {$order->user->lastName}",
                'timestamp' => $order->created_at,
                'createdAt' => $order->created_at
            ];
        }
      
        $recentUsers = User::where('created_at', '>=', now()->subWeek())
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get();
            
        foreach ($recentUsers as $user) {
            $activities[] = [
                'type' => 'user_registration',
                'description' => "New user registered: {$user->firstName} {$user->lastName}",
                'timestamp' => $user->created_at,
                'createdAt' => $user->created_at
            ];
        }
        $recentBooks = \App\Models\Book::where('created_at', '>=', now()->subMonth())
            ->orderBy('created_at', 'desc')
            ->limit(2)
            ->get();
            
        foreach ($recentBooks as $book) {
            $activities[] = [
                'type' => 'book_added',
                'description' => "New book added: {$book->title}",
                'timestamp' => $book->created_at,
                'createdAt' => $book->created_at
            ];
        }
        
        
        usort($activities, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        $activities = array_slice($activities, 0, 6);

        return response()->json([
            'status' => 'success',
            'data' => $activities
        ]);

    } catch (\Exception $e) {
        Log::error('Error fetching recent activities: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch recent activities'
        ], 500);
    }
}

public function getAdminProfile()
{
    try {
        $user = auth()->user();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not authenticated'
            ], 401);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'fullName' => $user->firstName . ' ' . $user->lastName,
                'email' => $user->email,
                'role' => $user->userType,
                'mobileNumber' => $user->mobileNumber
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('Error fetching admin profile: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch admin profile'
        ], 500);
    }
}
}

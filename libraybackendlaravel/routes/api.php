<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BookController;
use App\Http\Controllers\BookCategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;

Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/login', [AuthController::class, 'login']);
Route::apiResource('/book', BookController::class);
Route::apiResource('/bookCategory', BookCategoryController::class);

Route::middleware(['jwt.auth'])->group(function () {
    
   
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });

    
    Route::get('/dashboard/stats', [UserController::class, 'getDashboardStats']);
    Route::get('/dashboard/activities', [UserController::class, 'getRecentActivities']);
    
    
    Route::get('/system/health', [OrderController::class, 'getSystemHealth']);
    
    
    Route::get('/admin/profile', [UserController::class, 'getAdminProfile']);

    
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'getUsers']);
        Route::get('/search', [UserController::class, 'searchUsers']);
        Route::get('/unapproved', [UserController::class, 'getUnapprovedUsers']);
        Route::get('/students', [UserController::class, 'getStudents']);
        Route::get('/admins', [UserController::class, 'getAdmins']);
        Route::get('/blocked', [UserController::class, 'getBlockedUsers']);
        Route::get('/stats/{userId}', [UserController::class, 'getUserStats']);
        Route::put('/approve/{userId}', [UserController::class, 'approveUser']);
        Route::put('/block/{userId}', [UserController::class, 'blockUser']);
        Route::put('/unblock/{userId}', [UserController::class, 'unblockUser']);
        Route::post('/block-overdue', [UserController::class, 'blockFineOverdueUsers']);
    });

    
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']);
        Route::get('/pending', [OrderController::class, 'getPendingOrders']);
        Route::put('/approve/{orderId}', [OrderController::class, 'approveOrder']);
        Route::put('/reject/{orderId}', [OrderController::class, 'rejectOrder']);
        Route::get('/search', [OrderController::class, 'searchOrders']);
        Route::get('/stats', [OrderController::class, 'getOrderStats']);
        Route::get('/overdue', [OrderController::class, 'getOverdueOrders']);
        Route::post('/bulk-approve', [OrderController::class, 'bulkApproveOrders']);
        Route::post('/return', [OrderController::class, 'returnBook']);
        Route::post('/{orderId}/pay-fine', [OrderController::class, 'payFine']);
        Route::get('/check-overdue', [OrderController::class, 'checkOverdueBooks']);
        Route::get('/user-orders/{userId}', [OrderController::class, 'getUserOrders']);
    });

    Route::get('/test-order/{id}', function($id) {
    try {
        $order = \App\Models\Order::find($id);
        return response()->json([
            'exists' => !!$order,
            'order' => $order
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});

Route::get('/debug/test-order/{id}', function($id) {
    try {
        $order = \App\Models\Order::find($id);
        
        if (!$order) {
            return response()->json([
                'exists' => false,
                'message' => 'Order not found',
                'searched_id' => $id,
                'all_order_ids' => \App\Models\Order::pluck('id')
            ]);
        }
        
        return response()->json([
            'exists' => true,
            'order' => [
                'id' => $order->id,
                'status' => $order->status,
                'userName' => $order->userName,
                'bookTitle' => $order->bookTitle,
                'userId' => $order->userId,
                'bookId' => $order->bookId
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

Route::get('/debug/test-reject/{id}', function($id) {
    try {
      
        ini_set('display_errors', 1);
        ini_set('display_startup_errors', 1);
        error_reporting(E_ALL);
        
        $order = \App\Models\Order::find($id);
        
        if (!$order) {
            return response()->json([
                'error' => 'Order not found',
                'order_id' => $id,
                'available_orders' => \App\Models\Order::pluck('id')
            ], 404);
        }
        
        
        $originalStatus = $order->status;
        $order->status = 'REJECTED';
        $saveResult = $order->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Order rejected via debug route',
            'order_id' => $order->id,
            'original_status' => $originalStatus,
            'new_status' => $order->status,
            'save_result' => $saveResult
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

    
    Route::prefix('books')->group(function () {
        Route::get('/available', [BookController::class, 'getAvailableBooks']);
        Route::get('/search', [BookController::class, 'searchBooks']);
    });

  
    Route::get('/BlockFineOverdueUsers', [UserController::class, 'blockFineOverdueUsers']);
    Route::get('/SendEmailForPendingReturns', [OrderController::class, 'sendEmailForPendingReturns']);
});

Route::fallback(function () {
    return response()->json(['message' => 'Endpoint not found'], 404);
});
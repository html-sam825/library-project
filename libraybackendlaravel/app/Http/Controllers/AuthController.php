<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Mail\NewUserApprovalRequest;

class AuthController extends Controller
{
    public function signup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firstName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'mobileNumber' => 'nullable|string|max:15',
            'password' => 'required|string|min:6|confirmed',
            'userType' => 'required|in:ADMIN,STUDENT',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
          
            $isAdmin = $request->userType === 'ADMIN';
            $accountStatus = $isAdmin ? 'APPROVED' : 'UNAPPROVED';
            $maxBooksLimit = $isAdmin ? 10 : 3; 
            $canBorrow = $isAdmin;

            $user = User::create([
                'firstName' => $request->firstName,
                'lastName' => $request->lastName,
                'email' => $request->email,
                'password' => $request->password, 
                'mobileNumber' => $request->mobileNumber,
                'userType' => $request->userType,
                'accountStatus' => $accountStatus,
                'max_books_limit' => $maxBooksLimit,
                'can_borrow' => $canBorrow,
            ]);

            
            if (!$isAdmin) {
                $this->sendApprovalEmailToAdmin($user);
            }

            return response()->json([
                'status' => 'success',
                'message' => $isAdmin 
                    ? 'Admin account created successfully.' 
                    : 'Student account created successfully. Waiting for admin approval.',
                'user' => [
                    'id' => $user->id,
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName,
                    'email' => $user->email,
                    'userType' => $user->userType,
                    'accountStatus' => $user->accountStatus,
                    'max_books_limit' => $user->max_books_limit,
                    'can_borrow' => $user->can_borrow,
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Signup error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error creating user account'
            ], 500);
        }
    }

    private function sendApprovalEmailToAdmin(User $user)
    {
        try {
            $adminEmails = User::where('userType', 'ADMIN')->pluck('email');
            
            if ($adminEmails->isEmpty()) {
                Log::warning('No admin users found to send approval email');
                return;
            }

            foreach ($adminEmails as $adminEmail) {
                Mail::to($adminEmail)->send(new NewUserApprovalRequest(
                    $user->firstName . ' ' . $user->lastName,
                    $user->email,
                    $user->mobileNumber
                ));
            }

            Log::info('Approval email sent to admin for user: ' . $user->email);

        } catch (\Exception $e) {
            Log::error('Failed to send approval email: ' . $e->getMessage());
            
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        try {
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid email or password'
                ], 401);
            }

            $user = JWTAuth::user();

           
            if ($user->accountStatus === 'UNAPPROVED') {
                return response()->json([
                    'status' => 'unapproved',
                    'message' => 'Your account is pending approval. Please wait for administrator approval.'
                ], 403);
            }

            if ($user->accountStatus === 'BLOCKED') {
                return response()->json([
                    'status' => 'blocked', 
                    'message' => 'Your account has been blocked. Please contact the administrator.'
                ], 403);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName,
                    'email' => $user->email,
                    'mobileNumber' => $user->mobileNumber,
                    'userType' => $user->userType,
                    'accountStatus' => $user->accountStatus,
                    'max_books_limit' => $user->max_books_limit,
                    'can_borrow' => $user->can_borrow,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Login failed. Please try again.'
            ], 500);
        }
    }

    public function logout()
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            
            return response()->json([
                'status' => 'success',
                'message' => 'Logged out successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error during logout'
            ], 500);
        }
    }

    public function me()
    {
        try {
            $user = JWTAuth::user();
            
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'firstName' => $user->firstName,
                    'lastName' => $user->lastName,
                    'email' => $user->email,
                    'mobileNumber' => $user->mobileNumber,
                    'userType' => $user->userType,
                    'accountStatus' => $user->accountStatus,
                    'max_books_limit' => $user->max_books_limit,
                    'can_borrow' => $user->can_borrow,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get user error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Unable to get user data'
            ], 500);
        }
    }

    public function refresh()
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            
            return response()->json([
                'status' => 'success',
                'token' => $token
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Could not refresh token'
            ], 401);
        }
    }
}
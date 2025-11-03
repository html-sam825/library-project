<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'firstName',
        'lastName',
        'email',
        'mobileNumber',
        'password', 
        'userType',
        'accountStatus',
        'max_books_limit',
        'can_borrow'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'can_borrow' => 'boolean',
            'max_books_limit' => 'integer',
        ];
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'userId');
    }

    
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }
  
    public function getJWTCustomClaims()
    {
        return [
            'id' => $this->id,
            'firstName' => $this->firstName,
            'lastName' => $this->lastName,
            'email' => $this->email,
            'mobileNumber' => $this->mobileNumber,
            'userType' => $this->userType,
            'accountStatus' => $this->accountStatus,
            'createdOn' => $this->created_at->toISOString(),
        ];
    }

    
    public function isAdmin(): bool
    {
        return $this->userType === 'ADMIN';
    }

    public function isStudent(): bool
    {
        return $this->userType === 'STUDENT';
    }

    public function isApproved(): bool
    {
        return $this->accountStatus === 'APPROVED';
    }

    public function canBorrowBooks(): bool
    {
        return $this->can_borrow && $this->isApproved();
    }

    public function getRemainingBookLimit(): int
    {
        $borrowedCount = $this->orders()->whereIn('status', ['BORROWED', 'OVERDUE'])->count();
        return max(0, $this->max_books_limit - $borrowedCount);
    }

    public function getFullName(): string
    {
        return $this->firstName . ' ' . $this->lastName;
    }
}
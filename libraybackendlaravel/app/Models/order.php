<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'userId',
        'userName',                
        'bookId',
        'bookTitle',
        'orderDate',
        'returned',
        'returnDate',
        'finePaid',
        'status',
        'approved_at',
        'returned_at',
        'fine_amount'
       
        
    ];
     protected $casts = [
        'orderDate' => 'datetime',
        'approved_at' => 'datetime',
        'returned_at' => 'datetime',
        'finePaid' => 'boolean',
    ];
     public function user()
    {
        return $this->belongsTo(User::class, 'userId');
    }

    public function book()
    {
        return $this->belongsTo(Book::class, 'bookId');
    }

    
}

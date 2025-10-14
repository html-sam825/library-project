<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class order extends Model
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
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory; 

class Book extends Model
{
      use HasFactory;

    protected $fillable = [
        'title',
        'author',
        'price',
        'ordered',
        'bookCategoryId',
    ];
    protected $with = ['bookCategory'];

      public function bookCategory()
    {
        return $this->belongsTo(BookCategory::class, 'bookCategoryId');
    }
}

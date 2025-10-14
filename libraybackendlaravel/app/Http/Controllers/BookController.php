<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Book;

class BookController extends Controller
{
      protected $book;
    public function __construct(){
        $this->book = new Book();
    }
    public function index(){
        return $this->book::with('bookCategory')->get();
    }
    public function store(Request $request){
        return $this->book-> create($request->all());
    }
    public function update(Request $request, string $id){
        $book = $this->book->find($id);
        $book->update($request->all());
        return $book;
    }
    public function destroy(string $id){
        $book = $this->book->find($id);
        return $book->delete();
    }
    //
}

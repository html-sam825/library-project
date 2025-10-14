<?php

namespace App\Http\Controllers;


use Illuminate\Http\Request;
use  App\Models\BookCategory;

class BookCategoryController extends Controller
{
  protected  $bookCategory;
  public function __construct()
{
    $this->bookCategory = new BookCategory();
}
public function index () {
     return BookCategory::with('books')->get();
}
public function store(Request $request){
        return $this->bookCategory-> create($request->all());
    }
    public function update(Request $request, string $id){
        $bookCategory = $this->bookCategory->find($id);
        $bookCategory->update($request->all());
        return $bookCategory;
    }
    public function destroy(string $id){
        $bookCategory = $this->bookCategory->find($id);
        return $bookCategory->delete();


    }
   
}


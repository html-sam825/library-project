<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;

class OrderController extends Controller
{
     protected $order;

    public function __construct()
    {
        $this->order = new Order();
    }

    public function index()
    {
        return $this->order->all();
    }

    public function store(Request $request)
    {
        return $this->order->create($request->all());
    }

    public function update(Request $request, string $id)
    {
        $order = $this->order->find($id);
        $order->update($request->all());
        return $order;
    }

    public function destroy(string $id)
    {
        $order = $this->order->find($id);
        return $order->delete();
    }
}

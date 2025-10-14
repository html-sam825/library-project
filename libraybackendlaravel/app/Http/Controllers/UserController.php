<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

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
            'accountStatus' => 'in:ACTIVE,BLOCKED,UNAPPROVED',
        ]);

        $data['password'] = Hash::make($data['password']);
        return User::create($data);
    }

    public function show($id)
    {
        return User::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update($request->all());
        return $user;
    }

    public function destroy($id)
    {
        return User::destroy($id);
    }
}

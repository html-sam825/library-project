<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class AccountApproved extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function build()
    {
        return $this->subject('Your Account Has Been Approved - Library System')
                    ->view('emails.account_approved')
                    ->with([
                        'userName' => $this->user->firstName,
                        'user' => $this->user 
                    ]);
    }

    
}
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class NewUserApprovalRequest extends Mailable
{
    use Queueable, SerializesModels;

     public $userName;
    public $userEmail;
    public $userMobile;
    public $approvalLink;

    public function __construct($userName, $userEmail, $userMobile = null)
    {
         $this->userName = $userName;
        $this->userEmail = $userEmail;
        $this->userMobile = $userMobile;
        $this->approvalLink = url('/admin/approval-requests');
    }
      public function build()
    {
        return $this->subject('New User Approval Request - Library System')
                    ->view('emails.new_user_approval');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New User Approval Request',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'view.name',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

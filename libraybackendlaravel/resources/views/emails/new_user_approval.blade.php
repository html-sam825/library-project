<!DOCTYPE html>
<html>
<head>
    <title>New User Approval Request - Library Management System</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .user-info { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
        .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h2>New User Registration Requires Approval</h2>
        
        <p>Hello Admin,</p>
        
        <p>A new user has registered and is awaiting your approval:</p>
        
        <div class="user-info">
            <p><strong>First Name:</strong> {{ $firstName }}</p>
            <p><strong>Last Name:</strong> {{ $lastName }}</p>
            <p><strong>Full Name:</strong> {{ $firstName }} {{ $lastName }}</p>
            <p><strong>Email:</strong> {{ $userEmail }}</p>
            <p><strong>Mobile:</strong> {{ $userMobile }}</p>
            <p><strong>User Type:</strong> {{ $userType }}</p>
            <p><strong>Registration Date:</strong> {{ $registrationDate }}</p>
        </div>
        
        <p>Please review this registration in the admin panel:</p>
        
        <p>
            <a href="{{ $approvalLink }}" class="button">
                Review User Registration
            </a>
        </p>
        
        <div class="footer">
            <p>Thank you,<br><strong>Library Management System</strong></p>
            <p style="font-size: 12px; color: #999;">
                This is an automated notification. Please do not reply to this email.
            </p>
        </div>
    </div>
</body>
</html>
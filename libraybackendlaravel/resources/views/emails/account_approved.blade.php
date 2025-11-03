<!DOCTYPE html>
<html>
<head>
    <title>Account Approved</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 20px; }
        .features { background: white; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
        .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Library Management System!</h1>
        </div>
        
        <div class="content">
           <p>Dear {{ $user->firstName }},</p>
            
            <p>We're excited to inform you that your account has been approved!</p>
            
            <div class="features">
                <p><strong>You can now:</strong></p>
                <ul>
                    <li>Log in to your account</li>
                    <li>Browse and order books</li>
                    <li>Borrow up to {{ $maxBooksLimit ?? 3 }} books at a time</li>
                    <li>Access all library resources</li>
                </ul>
            </div>
            
            <p>Get started by logging into your account and exploring our book collection:</p>
            
            <p style="text-align: center;">
                <a href="{{ $loginLink ?? url('/login') }}" class="button">
                    Login to Your Account
                </a>
            </p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        </div>
        
        <div style="text-align: center; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>Happy reading!<br><strong>Library Management System Team</strong></p>
        </div>
    </div>
</body>
</html>
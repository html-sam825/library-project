<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        //
        DB::table('users')
            ->where('accountStatus', 'ACTIVE')
            ->update(['accountStatus' => 'APPROVED']);

             DB::statement("ALTER TABLE users MODIFY accountStatus ENUM('APPROVED', 'BLOCKED', 'UNAPPROVED') DEFAULT 'UNAPPROVED'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
         DB::table('users')
            ->where('accountStatus', 'APPROVED')
            ->update(['accountStatus' => 'ACTIVE']);

        DB::statement("ALTER TABLE users MODIFY accountStatus ENUM('ACTIVE', 'BLOCKED', 'UNAPPROVED') DEFAULT 'UNAPPROVED'");
    }
};

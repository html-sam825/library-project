<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
  
    public function up(): void
    {
        
        DB::statement("ALTER TABLE orders MODIFY status ENUM('PENDING', 'APPROVED', 'REJECTED', 'RETURNED') DEFAULT 'PENDING'");
        
        
        Schema::table('orders', function (Blueprint $table) {
            $table->dateTime('orderDate')->nullable()->change();
            $table->dateTime('returnDate')->nullable()->change();
        });
        
        
        Schema::table('orders', function (Blueprint $table) {
            $table->boolean('finePaid')->default(false)->change();
        });
    }

    
    public function down(): void
    {
        
        DB::statement("ALTER TABLE orders MODIFY status ENUM('PENDING', 'APPROVED', 'RETURNED') DEFAULT 'PENDING'");
        
     
        Schema::table('orders', function (Blueprint $table) {
            $table->date('orderDate')->nullable()->change();
            $table->date('returnDate')->nullable()->change();
        });
        
      
        Schema::table('orders', function (Blueprint $table) {
            $table->integer('finePaid')->default(0)->change();
        });
    }
};
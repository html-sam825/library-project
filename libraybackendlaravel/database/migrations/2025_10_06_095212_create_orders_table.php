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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('userId');
            $table->string('userName');
            $table->unsignedBigInteger('bookId');
            $table->string('bookTitle');
            $table->date('orderDate')->nullable();
            $table->boolean('returned')->default(false);
            $table->date('returnDate')->nullable();
            $table->integer('finePaid')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};

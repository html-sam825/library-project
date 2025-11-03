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
            $table->enum('status', ['PENDING', 'APPROVED', 'RETURNED'])->default('PENDING');
            $table->dateTime('approved_at')->nullable();
            $table->dateTime('returned_at')->nullable();
            $table->decimal('fine_amount', 8, 2)->default(0);
            $table->integer('finePaid')->default(false);
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

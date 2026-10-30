<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $guarded = [];

    public function businesses()
    {
        return $this->hasMany(Business::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'organization_users')->withPivot('role', 'status')->withTimestamps();
    }
}

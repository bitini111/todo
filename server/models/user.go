package models

import "time"

type User struct {
	ID        int64     `json:"id" db:"id"`
	Username  string    `json:"username" db:"username"`
	Password  string    `json:"-" db:"password"` // never serialize
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

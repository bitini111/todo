package models

import "time"

type Task struct {
	ID          int64      `json:"id" db:"id"`
	UserID      int64      `json:"userId" db:"user_id"`
	Title       string     `json:"title" db:"title"`
	Description string     `json:"description" db:"description"`
	Status      string     `json:"status" db:"status"`
	Priority    string     `json:"priority" db:"priority"`
	CompletedAt *time.Time `json:"completedAt" db:"completed_at"`
	CreatedAt   time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time  `json:"updatedAt" db:"updated_at"`
}

// TaskInput is the JSON body for creating/updating a task
type TaskInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Priority    string `json:"priority"`
}

// AuthInput is the JSON body for register/login
type AuthInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// AuthResponse is returned on successful auth
type AuthResponse struct {
	Token    string `json:"token"`
	Username string `json:"username"`
}

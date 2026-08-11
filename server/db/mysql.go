package db

import (
	"log"
	"strings"

	"github.com/jmoiron/sqlx"
	_ "github.com/go-sql-driver/mysql"
	"todo-server/config"
)

var DB *sqlx.DB

func Connect(cfg *config.Config) {
	// First connect without a database to ensure it exists
	initDB, err := sqlx.Connect("mysql", cfg.DSNWithoutDB())
	if err != nil {
		log.Fatalf("Failed to connect to MySQL server: %v", err)
	}

	_, err = initDB.Exec("CREATE DATABASE IF NOT EXISTS " + cfg.DBName + " DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci")
	if err != nil {
		log.Fatalf("Failed to create database: %v", err)
	}
	initDB.Close()

	// Now connect to the target database
	DB, err = sqlx.Connect("mysql", cfg.DSN())
	if err != nil {
		log.Fatalf("Failed to connect to MySQL database %s: %v", cfg.DBName, err)
	}
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)
	log.Println("MySQL connected")
}

func AutoMigrate() {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id         BIGINT AUTO_INCREMENT PRIMARY KEY,
		username   VARCHAR(50)  NOT NULL UNIQUE,
		password   VARCHAR(255) NOT NULL,
		created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

	CREATE TABLE IF NOT EXISTS tasks (
		id          BIGINT AUTO_INCREMENT PRIMARY KEY,
		user_id     BIGINT       NOT NULL,
		title       VARCHAR(100) NOT NULL,
		description TEXT,
		status      ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
		priority    ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
		completed_at DATETIME,
		created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		INDEX idx_user_status (user_id, status)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`
	_, err := DB.Exec(schema)
	if err != nil {
		log.Fatalf("Failed to auto-migrate: %v", err)
	}
	// Add completed_at column if not exists
	_, err = DB.Exec("ALTER TABLE tasks ADD COLUMN completed_at DATETIME")
	if err != nil && !strings.Contains(err.Error(), "Duplicate column") {
		log.Printf("Warning: completed_at column may already exist: %v", err)
	}
	log.Println("Database schema ensured")
}

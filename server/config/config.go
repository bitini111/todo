package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  []byte
	ServerPort string
	UploadsDir string
}

func isTruthy(s string) bool {
	s = strings.ToLower(s)
	return s == "1" || s == "true" || s == "yes" || s == "on"
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	uploadDir := getEnv("UPLOADS_DIR", "uploads")

	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "todo_db"),
		JWTSecret:  []byte(getEnv("JWT_SECRET", "dev-secret")),
		ServerPort: getEnv("SERVER_PORT", "8080"),
		UploadsDir: uploadDir,
	}, nil
}

func (c *Config) DSN() string {
	return c.DBUser + ":" + c.DBPassword + "@tcp(" + c.DBHost + ":" + c.DBPort + ")/" + c.DBName + "?charset=utf8mb4&parseTime=true&loc=Local&multiStatements=true"
}

func (c *Config) DSNWithoutDB() string {
	return c.DBUser + ":" + c.DBPassword + "@tcp(" + c.DBHost + ":" + c.DBPort + ")/?charset=utf8mb4&parseTime=true&loc=Local&multiStatements=true"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

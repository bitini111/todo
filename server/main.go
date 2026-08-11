package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"todo-server/config"
	"todo-server/db"
	"todo-server/handlers"
	"todo-server/middleware"
	"todo-server/services"

	"github.com/go-chi/chi/v5"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Config error: %v", err)
	}

	services.SetJWTSecret(cfg.JWTSecret)

	db.Connect(cfg)
	db.AutoMigrate()

	// Ensure uploads directory
	if err := os.MkdirAll(cfg.UploadsDir, 0755); err != nil {
		log.Printf("WARN: cannot create uploads dir: %v", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.CORS)

	// Auth routes (no authentication required)
	r.Post("/api/register", http.HandlerFunc(handlers.Register))
	r.Post("/api/login", http.HandlerFunc(handlers.Login))

	// Protected routes
	authMW := middleware.JWTAuth(services.ParseToken)
	r.Group(func(r chi.Router) {
		r.Use(authMW)

		r.Get("/api/tasks", http.HandlerFunc(handlers.ListTasks))
		r.Post("/api/tasks", http.HandlerFunc(handlers.CreateTask))
		r.Put("/api/tasks/{id}", http.HandlerFunc(handlers.UpdateTask))
		r.Delete("/api/tasks/{id}", http.HandlerFunc(handlers.DeleteTask))

		r.Get("/api/report", http.HandlerFunc(handlers.ReportDownload))
		r.Post("/api/template", http.HandlerFunc(handlers.UploadTemplate))
		r.Get("/api/template", http.HandlerFunc(handlers.DownloadTemplate))
	})

	// Graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-stop
		log.Println("Shutting down server...")
		os.Exit(0)
	}()

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("Server listening on %s", addr)
	log.Printf("Config: DB=%s:%s/%s Uploads=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.UploadsDir)

	if err := http.ListenAndServe(addr, r); err != nil {
		if strings.Contains(err.Error(), "address already in use") {
			log.Fatalf("Port %s is already in use. Kill the other process or change SERVER_PORT in .env", cfg.ServerPort)
		}
		log.Fatalf("Server error: %v", err)
	}
}

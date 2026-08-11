package middleware

import (
	"context"
	"net/http"
	"strings"
)

type contextKey string

const UserIDKey contextKey = "user_id"

// JWTAuth is a middleware that validates the JWT token and injects user_id into the request context.
// It expects the JWT parsing function to be provided (to avoid circular imports).
func JWTAuth(parseToken func(string) (int64, error)) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			auth := r.Header.Get("Authorization")
			if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
				http.Error(w, `{"error":"请先登录"}`, http.StatusUnauthorized)
				return
			}

			token := strings.TrimPrefix(auth, "Bearer ")
			userID, err := parseToken(token)
			if err != nil {
				http.Error(w, `{"error":"登录已过期，请重新登录"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserID(r *http.Request) int64 {
	id, _ := r.Context().Value(UserIDKey).(int64)
	return id
}

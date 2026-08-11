package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"todo-server/db"
	"todo-server/models"
	"todo-server/services"

	"golang.org/x/crypto/bcrypt"
)

func Register(w http.ResponseWriter, r *http.Request) {
	var input models.AuthInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请求格式错误"})
		return
	}

	input.Username = strings.TrimSpace(input.Username)
	if len(input.Username) < 2 || len(input.Username) > 50 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "用户名长度需要2-50个字符"})
		return
	}
	if len(input.Password) < 4 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "密码长度不能少于4个字符"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "服务器错误"})
		return
	}

	result, err := db.DB.Exec("INSERT INTO users (username, password) VALUES (?, ?)", input.Username, string(hash))
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate") {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "用户名已存在"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "注册失败"})
		return
	}

	userID, _ := result.LastInsertId()
	token, err := services.GenerateToken(userID, input.Username)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "生成token失败"})
		return
	}

	writeJSON(w, http.StatusCreated, models.AuthResponse{Token: token, Username: input.Username})
}

func Login(w http.ResponseWriter, r *http.Request) {
	var input models.AuthInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请求格式错误"})
		return
	}

	input.Username = strings.TrimSpace(input.Username)

	var user models.User
	err := db.DB.Get(&user, "SELECT id, username, password FROM users WHERE username = ?", input.Username)
	if err == sql.ErrNoRows {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "用户名或密码错误"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "登录失败"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "用户名或密码错误"})
		return
	}

	token, err := services.GenerateToken(user.ID, user.Username)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "生成token失败"})
		return
	}

	writeJSON(w, http.StatusOK, models.AuthResponse{Token: token, Username: user.Username})
}

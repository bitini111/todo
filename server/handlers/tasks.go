package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"todo-server/db"
	"todo-server/middleware"
	"todo-server/models"

	"github.com/go-chi/chi/v5"
)

func ListTasks(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	var tasks []models.Task
	err := db.DB.Select(&tasks, "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC", userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "查询失败"})
		return
	}
	if tasks == nil {
		tasks = []models.Task{}
	}

	// 显示所有任务（pending、in_progress、completed 都显示）
	writeJSON(w, http.StatusOK, tasks)
}

func CreateTask(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	var input models.TaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请求格式错误"})
		return
	}

	input.Title = strings.TrimSpace(input.Title)
	if input.Title == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请输入任务标题"})
		return
	}
	if len(input.Title) > 100 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "标题不能超过100个字符"})
		return
	}
	if input.Status == "" {
		input.Status = "pending"
	}
	if input.Priority == "" {
		input.Priority = "medium"
	}

	result, err := db.DB.Exec(
		"INSERT INTO tasks (user_id, title, description, status, priority) VALUES (?, ?, ?, ?, ?)",
		userID, input.Title, input.Description, input.Status, input.Priority,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "创建失败"})
		return
	}

	id, _ := result.LastInsertId()

	var task models.Task
	err = db.DB.Get(&task, "SELECT * FROM tasks WHERE id = ?", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "查询失败"})
		return
	}

	writeJSON(w, http.StatusCreated, task)
}

func UpdateTask(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	taskID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "无效的任务ID"})
		return
	}

	// Load existing task for ownership check + partial update fill-in
	var existing models.Task
	err = db.DB.Get(&existing, "SELECT * FROM tasks WHERE id = ?", taskID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "任务不存在"})
		return
	}
	if existing.UserID != userID {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "无权操作"})
		return
	}

	var input models.TaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请求格式错误"})
		return
	}

	// Partial update: keep existing values for any unset field
	input.Title = strings.TrimSpace(input.Title)
	if input.Title == "" {
		input.Title = existing.Title
	}
	if input.Status == "" {
		input.Status = existing.Status
	}
	if input.Priority == "" {
		input.Priority = existing.Priority
	}

	if len(input.Title) > 100 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "标题不能超过100个字符"})
		return
	}

	_, err = db.DB.Exec(
		"UPDATE tasks SET title=?, description=?, status=?, priority=?, completed_at=CASE WHEN ?='completed' THEN NOW() ELSE NULL END WHERE id=?",
		input.Title, input.Description, input.Status, input.Priority, input.Status, taskID,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "更新失败"})
		return
	}

	var task models.Task
	_ = db.DB.Get(&task, "SELECT * FROM tasks WHERE id = ?", taskID)
	writeJSON(w, http.StatusOK, task)
}

func DeleteTask(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	taskID, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "无效的任务ID"})
		return
	}

	result, err := db.DB.Exec("DELETE FROM tasks WHERE id = ? AND user_id = ?", taskID, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "删除失败"})
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "任务不存在"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{})
}

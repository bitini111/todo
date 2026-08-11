package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"todo-server/db"
	"todo-server/middleware"
	"todo-server/models"
	"todo-server/services"

	"github.com/xuri/excelize/v2"
)

const templatePath = "uploads/template.xlsx"

func UploadTemplate(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "文件太大，最大5MB"})
		return
	}

	file, _, err := r.FormFile("template")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请选择要上传的Excel文件"})
		return
	}
	defer file.Close()

	os.MkdirAll(filepath.Dir(templatePath), 0755)

	dst, err := os.Create(templatePath)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "保存文件失败"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "保存文件失败"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "模板上传成功"})
}

func DownloadTemplate(w http.ResponseWriter, r *http.Request) {
	if !services.TemplateExists(templatePath) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "暂无上传的模板"})
		return
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename=template.xlsx")
	http.ServeFile(w, r, templatePath)
}

// ReportDownload generates a weekly Excel report.
// ReportDownload generates a weekly Excel report.
// If a template exists, it fills the template. Otherwise generates a clean multi-sheet report.
func ReportDownload(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	// Get user info
	var username string
	_ = db.DB.Get(&username, "SELECT username FROM users WHERE id = ?", userID)
	if username == "" {
		username = fmt.Sprintf("用户%d", userID)
	}

	now := time.Now()
	weekStart := toMonday(now)

	if ws := r.URL.Query().Get("week"); ws != "" {
		if parsed, err := time.Parse("2006-01-02", ws); err == nil {
			weekStart = toMonday(parsed)
		}
	}
	if period := r.URL.Query().Get("period"); period == "last" {
		weekStart = weekStart.AddDate(0, 0, -7)
	}

	weekStart = midnight(weekStart)
	weekEnd := weekStart.AddDate(0, 0, 7).Add(-time.Second)

	// Next week = the Monday after this Saturday (when reporting for "this" week, next week is the upcoming Monday)
	nextWeekStart := weekStart.AddDate(0, 0, 7)
	nextWeekEnd := nextWeekStart.AddDate(0, 0, 4) // Mon → Fri

	var tasks []models.Task
	if err := db.DB.Select(&tasks, "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC", userID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "查询任务失败"})
		return
	}

	stats := buildStats(tasks, weekStart, weekEnd)
	stats.Username = username
	stats.NextWeekStart = nextWeekStart.Format("2006-01-02")
	stats.NextWeekEnd = nextWeekEnd.Format("2006-01-02")

	// CSV export requested
	if format := r.URL.Query().Get("format"); format == "csv" {
		exportCSV(w, username, stats, tasks)
		return
	}

	var f *excelize.File
	var err error
	if services.TemplateExists(templatePath) {
		f, err = services.PopulateTemplate(templatePath, stats)
	} else {
		f, err = services.GenerateDefaultReport(stats)
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "生成周报失败: " + err.Error()})
		return
	}

	filename := fmt.Sprintf("周报-%s-%s.xlsx", username, stats.WeekStart)
	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", "attachment; filename="+strings.Replace(filename, " ", "_", -1))
	if err := f.Write(w); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "写入文件失败"})
	}
}

// exportCSV generates a simple CSV report with task details
func exportCSV(w http.ResponseWriter, username string, stats services.WeekStats, tasks []models.Task) {
	var buf strings.Builder
	buf.WriteString("\xef\xbb\xbf") // UTF-8 BOM
	buf.WriteString("执行人,状态,优先级,任务详情,创建时间,更新时间\n")

	for _, t := range tasks {
		status := statusLabel(t.Status)
		priority := priorityLabel(t.Priority)
		summary := t.Title
		if t.Description != "" {
			summary += "：" + t.Description
		}
		// Escape commas and quotes in CSV fields
		summary = strings.ReplaceAll(summary, `"`, `""`)
		if strings.Contains(summary, ",") || strings.Contains(summary, "\n") {
			summary = `"` + summary + `"`
		}
		status = strings.ReplaceAll(status, `"`, `""`)
		priority = strings.ReplaceAll(priority, `"`, `""`)
		usernameEsc := strings.ReplaceAll(username, `"`, `""`)

		buf.WriteString(fmt.Sprintf("%s,%s,%s,%s,%s,%s\n",
			usernameEsc,
			status,
			priority,
			summary,
			t.CreatedAt.Format("2006-01-02"),
			t.UpdatedAt.Format("2006-01-02"),
		))
	}

	filename := fmt.Sprintf("周报-%s-%s.csv", username, stats.WeekStart)
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename="+strings.Replace(filename, " ", "_", -1))
	w.Write([]byte(buf.String()))
}

func toMonday(d time.Time) time.Time {
	wd := d.Weekday()
	if wd == time.Sunday {
		wd = 7
	}
	return d.AddDate(0, 0, -int(wd)+1)
}

func midnight(d time.Time) time.Time {
	return time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, d.Location())
}

func buildStats(tasks []models.Task, start, end time.Time) services.WeekStats {
	ws := services.WeekStats{
		WeekStart: start.Format("2006-01-02"),
		WeekEnd:   end.Format("2006-01-02"),
	}

	cutoff := end.Add(24 * time.Hour)
	var updated, comp int

	for _, t := range tasks {
		inWeek := isInWeek(t.UpdatedAt, start, cutoff)

		if inWeek {
			updated++
			switch t.Status {
			case "pending":
				ws.Pending++
			case "in_progress":
				ws.InProgress++
			case "completed":
				ws.Completed++
				comp++
			}
		}
	}

	ws.Total = updated
	ws.UpdatedWeek = updated
	ws.CompletedWeek = comp
	if updated == 0 {
		ws.WeekRate = "0%"
	} else {
		ws.WeekRate = fmt.Sprintf("%.0f%%", float64(comp)/float64(updated)*100)
	}

	// Completed tasks: filter by completed_at (or updated_at if not set)
	ws.CompletedTasks = filterCompletedInWeek(tasks, start, cutoff)
	// In-progress and pending: filter by updated_at
	ws.InProgressTasks = filterUpdatedInWeek(tasks, "in_progress", start, cutoff, byPriorityThenTime)
	ws.PendingTasks = filterUpdatedInWeek(tasks, "pending", start, cutoff, byPriorityThenTime)

	return ws
}

// isInWeek checks if a time falls within the given week range
func isInWeek(t time.Time, start, cutoff time.Time) bool {
	return (t.Equal(start) || t.After(start)) && t.Before(cutoff)
}

// filterCompletedInWeek filters completed tasks that were completed this week
func filterCompletedInWeek(tasks []models.Task, start, cutoff time.Time) []models.Task {
	var f []models.Task
	for _, t := range tasks {
		if t.Status != "completed" {
			continue
		}
		// Use completed_at if set, otherwise fall back to updated_at
		refTime := t.UpdatedAt
		if t.CompletedAt != nil {
			refTime = *t.CompletedAt
		}
		if isInWeek(refTime, start, cutoff) {
			f = append(f, t)
		}
	}
	sort.Slice(f, func(i, j int) bool {
		return f[i].UpdatedAt.After(f[j].UpdatedAt)
	})
	return f
}

func filterUpdatedInWeek(tasks []models.Task, status string, start, cutoff time.Time, less func(a, b models.Task) bool) []models.Task {
	var f []models.Task
	for _, t := range tasks {
		if t.Status == status && isInWeek(t.UpdatedAt, start, cutoff) {
			f = append(f, t)
		}
	}
	sort.Slice(f, func(i, j int) bool { return less(f[i], f[j]) })
	return f
}

var priorityOrder = map[string]int{"high": 0, "medium": 1, "low": 2}

func byPriorityThenTime(a, b models.Task) bool {
	if priorityOrder[a.Priority] != priorityOrder[b.Priority] {
		return priorityOrder[a.Priority] < priorityOrder[b.Priority]
	}
	return a.CreatedAt.After(b.CreatedAt)
}

func filterByStatus(tasks []models.Task, status string, less func(a, b models.Task) bool) []models.Task {
	var f []models.Task
	for _, t := range tasks {
		if t.Status == status {
			f = append(f, t)
		}
	}
	sort.Slice(f, func(i, j int) bool { return less(f[i], f[j]) })
	return f
}

func statusLabel(s string) string {
	m := map[string]string{"pending": "待办", "in_progress": "进行中", "completed": "已完成"}
	if v, ok := m[s]; ok {
		return v
	}
	return s
}

func priorityLabel(p string) string {
	m := map[string]string{"high": "高", "medium": "中", "low": "低"}
	if v, ok := m[p]; ok {
		return v
	}
	return p
}

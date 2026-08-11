package services

import (
	"fmt"
	"os"
	"sort"
	"strings"
	"time"

	"todo-server/models"

	"github.com/xuri/excelize/v2"
)

type WeekStats struct {
	WeekStart       string
	WeekEnd         string
	NextWeekStart   string
	NextWeekEnd     string
	Total           int
	Pending         int
	InProgress      int
	Completed       int
	UpdatedWeek     int
	CompletedWeek   int
	WeekRate        string
	CompletedTasks  []models.Task
	InProgressTasks []models.Task
	PendingTasks    []models.Task
	Username        string
}

// GenerateDefaultReport creates a 5-sheet workbook from scratch.
func GenerateDefaultReport(stats WeekStats) (*excelize.File, error) {
	f := excelize.NewFile()
	f.DeleteSheet("Sheet1")

	// ── 概览 ──
	_, _ = f.NewSheet("概览")
	_ = f.SetCellValue("概览", "B1", fmt.Sprintf("本周概览 — %s", stats.Username))
	overview := [][2]string{
		{"时间范围", stats.WeekStart + "（周一） ~ " + stats.WeekEnd + "（周日）"},
		{"总任务数", fmt.Sprint(stats.Total)},
		{"本周更新", fmt.Sprint(stats.UpdatedWeek)},
		{"本周完成", fmt.Sprint(stats.CompletedWeek)},
		{"完成率", stats.WeekRate},
		{"待办", fmt.Sprint(stats.Pending)},
		{"进行中", fmt.Sprint(stats.InProgress)},
		{"已完成", fmt.Sprint(stats.Completed)},
	}
	for i, kv := range overview {
		_ = f.SetCellValue("概览", fmt.Sprintf("A%d", i+3), kv[0])
		_ = f.SetCellValue("概览", fmt.Sprintf("B%d", i+3), kv[1])
	}
	_ = f.SetColWidth("概览", "A", "A", 14)
	_ = f.SetColWidth("概览", "B", "B", 40)

	// ── 任务明细 ──
	addTaskSheet(f, "任务明细", stats)

	// ── 本周完成 ──
	addSectionSheet(f, "本周完成", stats.CompletedTasks)

	// ── 当前推进中 ──
	addSectionSheet(f, "当前推进中", stats.InProgressTasks)

	// ── 下周待关注 ──
	addSectionSheet(f, "下周待关注", stats.PendingTasks)

	idx, _ := f.GetSheetIndex("概览")
	f.SetActiveSheet(idx)

	return f, nil
}

func addTaskSheet(f *excelize.File, name string, stats WeekStats) {
	_, _ = f.NewSheet(name)
	headers := []string{"标题", "描述", "状态", "优先级", "创建时间", "更新时间"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(name, cell, h)
	}
	row := 2
	for _, section := range []struct {
		tasks []models.Task
	}{
		{stats.CompletedTasks},
		{stats.InProgressTasks},
		{stats.PendingTasks},
	} {
		for _, t := range section.tasks {
			_ = f.SetCellValue(name, fmt.Sprintf("A%d", row), t.Title)
			_ = f.SetCellValue(name, fmt.Sprintf("B%d", row), t.Description)
			_ = f.SetCellValue(name, fmt.Sprintf("C%d", row), statusLabel(t.Status))
			_ = f.SetCellValue(name, fmt.Sprintf("D%d", row), priorityLabel(t.Priority))
			_ = f.SetCellValue(name, fmt.Sprintf("E%d", row), t.CreatedAt.Format("2006-01-02"))
			_ = f.SetCellValue(name, fmt.Sprintf("F%d", row), t.UpdatedAt.Format("2006-01-02"))
			row++
		}
	}
	_ = f.SetColWidth(name, "A", "A", 30)
	_ = f.SetColWidth(name, "B", "B", 40)
}

func addSectionSheet(f *excelize.File, name string, tasks []models.Task) {
	_, _ = f.NewSheet(name)
	headers := []string{"标题", "描述", "优先级", "更新时间"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(name, cell, h)
	}
	for i, t := range tasks {
		row := i + 2
		_ = f.SetCellValue(name, fmt.Sprintf("A%d", row), t.Title)
		_ = f.SetCellValue(name, fmt.Sprintf("B%d", row), t.Description)
		_ = f.SetCellValue(name, fmt.Sprintf("C%d", row), priorityLabel(t.Priority))
		_ = f.SetCellValue(name, fmt.Sprintf("D%d", row), t.UpdatedAt.Format("2006-01-02"))
	}
	_ = f.SetColWidth(name, "A", "A", 30)
	_ = f.SetColWidth(name, "B", "B", 40)
}

// PopulateTemplate fills a single-sheet template with real task data.
func PopulateTemplate(path string, stats WeekStats) (*excelize.File, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, fmt.Errorf("无法打开模板: %w", err)
	}

	sheet := f.GetSheetList()[0]
	rows, err := f.GetRows(sheet)
	if err != nil || len(rows) == 0 {
		return GenerateDefaultReport(stats)
	}

	// Counters for date rows (template has 2: 上周总结 + 下周计划)
	dateCount := 0

	// --- Step 1: Update date rows and placeholder cells ---
	for r, row := range rows {
		rowNum := r + 1
		for c, val := range row {
			col, _ := excelize.ColumnNumberToName(c + 1)

			// {{placeholder}} replacement
			if strings.Contains(val, "{{") && strings.Contains(val, "}}") {
				fillPlaceholder(f, sheet, col, rowNum, val, stats)
				continue
			}

			if c > 0 {
				continue
			}

			trimmed := strings.TrimSpace(val)

			// Label matching
			switch trimmed {
			case "总任务数":
				_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", rowNum), stats.Total)
			case "本周更新":
				_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", rowNum), stats.UpdatedWeek)
			case "本周完成":
				_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", rowNum), stats.CompletedWeek)
			case "完成率":
				_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", rowNum), stats.WeekRate)
			case "待办":
				_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", rowNum), stats.Pending)
			case "进行中":
				_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", rowNum), stats.InProgress)
			case "已完成":
				_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", rowNum), stats.Completed)
			}

			// Date rows — first one = this week (总结), second = next week (计划)
			if strings.Contains(trimmed, "日期") {
				dateCount++
				var startStr, endStr string
				if dateCount == 1 {
					startStr, endStr = stats.WeekStart, stats.WeekEnd
				} else {
					startStr, endStr = stats.NextWeekStart, stats.NextWeekEnd
				}
				_ = f.SetCellValue(sheet, col+fmt.Sprint(rowNum),
					fmt.Sprintf("日期：%s（周一）~ %s（周五）", startStr, endStr))
			}
		}
	}

	// --- Step 2: Find "执行人" header rows and fill data ---
	var area1Start, area1End, area2Start, area2End int
	for r, row := range rows {
		rowNum := r + 1
		if len(row) == 0 {
			continue
		}

		first := strings.TrimSpace(row[0])

		// "执行人" marks the start of a data area
		if strings.Contains(first, "执行人") {
			if area1Start == 0 {
				area1Start = rowNum
			} else {
				area2Start = rowNum
			}
			continue
		}

		// Section titles ("工作总结"/"工作计划") mark area boundaries
		if strings.Contains(first, "工作") && (strings.Contains(first, "计划") || strings.Contains(first, "总结")) {
			if area1Start > 0 && area1End == 0 && area2Start == 0 {
				area1End = rowNum
			}
			if area2Start > 0 && area2End == 0 {
				area2End = rowNum
			}
		}
	}

	// Default boundaries: extend to end of sheet if not found
	if area1End == 0 {
		area1End = len(rows) + 1
	}
	if area2End == 0 {
		// area2 extends from area2Start to end of sheet
		if area2Start > 0 {
			// Use a generous default (at least 10 rows) so there's room to write new tasks
			area2End = area2Start + 10
		} else {
			// No second area, extend first area to end
			area1End = len(rows) + 1
		}
	}

	// Fix: if area2Start >= area2End, the second area has no data rows — skip it
	if area2Start > 0 && area2Start >= area2End {
		area2Start = 0
	}

	// Area 1 = 上周总结 → completed tasks (area1Start is the header row, data starts at +1)
	if area1Start > 0 {
		fillTaskArea(f, sheet, area1Start+1, area1End-1, stats.CompletedTasks, stats.Username)
	}

	// Area 2 = 下周计划 → pending + in_progress tasks (area2Start is the header row, data starts at +1)
	if area2Start > 0 {
		fillTaskArea(f, sheet, area2Start+1, area2End-1, append(stats.PendingTasks, stats.InProgressTasks...), stats.Username)
	} else if area1Start > 0 {
		fillTaskArea(f, sheet, area1Start+1, area1End-1, stats.PendingTasks, stats.Username)
	}

	return f, nil
}

// readHeaderMap reads a header row and returns a map from normalized header text → column letter
func readHeaderMap(f *excelize.File, sheet string, rowNum int) map[string]string {
	m := map[string]string{}
	if rowNum < 1 {
		return m
	}
	row, _ := f.GetRows(sheet)
	if rowNum > len(row) {
		return m
	}
	for c, val := range row[rowNum-1] {
		trimmed := strings.TrimSpace(val)
		if trimmed == "" {
			continue
		}
		col, _ := excelize.ColumnNumberToName(c + 1)
		m[trimmed] = col
	}
	return m
}

// findCol tries to find a column by checking multiple keyword variants against the header map
func findCol(cm map[string]string, keywords []string) string {
	for _, kw := range keywords {
		for header, col := range cm {
			if strings.Contains(header, kw) {
				return col
			}
		}
	}
	return ""
}

func fillTaskArea(f *excelize.File, sheet string, startRow, endRow int, tasks []models.Task, username string) {
	// Find header map from the header row (first non-empty row before startRow)
	headerRow := startRow - 1
	cm := readHeaderMap(f, sheet, headerRow)

	// Map template headers to column letters
	colUser := findCol(cm, []string{"执行人"})
	colTask := findCol(cm, []string{"工作内容", "内容"})
	colStatus := findCol(cm, []string{"状态"})
	colNote := findCol(cm, []string{"备注"})
	colPriority := findCol(cm, []string{"优先级"})

	// If status column wasn't found by keyword, fall back to common positions
	if colStatus == "" {
		if _, ok := cm["状态"]; ok {
			colStatus = cm["状态"]
		} else {
			colStatus = "E" // default: 5th column
		}
	}
	if colPriority == "" {
		if _, ok := cm["优先级"]; ok {
			colPriority = cm["优先级"]
		} else {
			// For 本周总结, priority goes to C (计划目标) if it exists
			if c := findCol(cm, []string{"计划目标"}); c != "" {
				colPriority = c
			}
		}
	}

	// Clear existing data rows
	for rr := startRow; rr <= endRow; rr++ {
		for _, col := range []string{"A", "B", "C", "D", "E", "F", "G"} {
			_ = f.SetCellValue(sheet, fmt.Sprintf("%s%d", col, rr), "")
		}
	}

	// Write tasks
	row := startRow
	for _, t := range tasks {
		if row > endRow {
			_ = f.InsertRows(sheet, row, 1)
			endRow++
		}
		if colUser != "" {
			_ = f.SetCellValue(sheet, fmt.Sprintf("%s%d", colUser, row), username)
		}
		if colTask != "" {
			_ = f.SetCellValue(sheet, fmt.Sprintf("%s%d", colTask, row), taskSummary(t))
		}
		if colPriority != "" {
			_ = f.SetCellValue(sheet, fmt.Sprintf("%s%d", colPriority, row), priorityLabel(t.Priority))
		}
		if colStatus != "" {
			_ = f.SetCellValue(sheet, fmt.Sprintf("%s%d", colStatus, row), statusLabel(t.Status))
		}
		if colNote != "" {
			_ = f.SetCellValue(sheet, fmt.Sprintf("%s%d", colNote, row), "")
		}
		row++
	}
}

func taskSummary(t models.Task) string {
	if t.Description != "" {
		return t.Title + "：" + t.Description
	}
	return t.Title
}

func fillPlaceholder(f *excelize.File, sheet, col string, rowNum int, placeholder string, stats WeekStats) {
	key := strings.TrimSpace(strings.TrimPrefix(strings.TrimSuffix(placeholder, "}}"), "{{"))

	var val interface{}
	switch key {
	case "week_start":
		val = stats.WeekStart
	case "week_end":
		val = stats.WeekEnd
	case "next_week_start":
		val = stats.NextWeekStart
	case "next_week_end":
		val = stats.NextWeekEnd
	case "total":
		val = stats.Total
	case "pending":
		val = stats.Pending
	case "in_progress":
		val = stats.InProgress
	case "completed":
		val = stats.Completed
	case "updated_week":
		val = stats.UpdatedWeek
	case "completed_week":
		val = stats.CompletedWeek
	case "week_rate":
		val = stats.WeekRate
	case "username":
		val = stats.Username
	default:
		return
	}
	_ = f.SetCellValue(sheet, col+fmt.Sprint(rowNum), val)
}

// ── helpers ──

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

func TemplateExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func filterSort(tasks []models.Task, status string, less func(a, b models.Task) bool) []models.Task {
	var f []models.Task
	for _, t := range tasks {
		if t.Status == status {
			f = append(f, t)
		}
	}
	sort.Slice(f, func(i, j int) bool { return less(f[i], f[j]) })
	return f
}

func NextWeekStart(stats WeekStats) time.Time {
	end, err := time.Parse("2006-01-02", stats.WeekEnd)
	if err != nil {
		return time.Now().AddDate(0, 0, 7)
	}
	return end.AddDate(0, 0, 1)
}

func NextWeekEnd(start time.Time) time.Time {
	return start.AddDate(0, 0, 4) // Monday→Friday
}

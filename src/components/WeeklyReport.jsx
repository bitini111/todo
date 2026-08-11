import { useState } from 'react'
import { getWeekStart, formatDate } from '../utils/week'

/** @param {object} props */
function WeeklyReport({ tasks }) {
  const [uploadMsg, setUploadMsg] = useState('')

  const weekStart = getWeekStart()
  const weekStartStr = formatDate(weekStart)

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch(`/api/report?period=this&week=${weekStartStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('下载失败')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `周报-${weekStartStr}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('导出失败：' + err.message)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadMsg('上传中...')
    try {
      const token = localStorage.getItem('auth-token')
      const formData = new FormData()
      formData.append('template', file)
      const res = await fetch('/api/template', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('上传失败')
      setUploadMsg('模板上传成功')
    } catch (err) {
      setUploadMsg('上传失败：' + err.message)
    }
  }

  return (
    <div className="space-y-3">
      <button
        className="w-full rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        onClick={handleExport}
      >
        导出 Excel 周报
      </button>
    </div>
  )
}

export default WeeklyReport

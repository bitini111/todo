import { useState } from 'react'

const DAYS = ['日', '一', '二', '三', '四', '五', '六']

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const today = new Date()
  const todayDate = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const isEmptyDay = (day) => day < firstDay
  const isToday = (day) =>
    day === todayDate && month === todayMonth && year === todayYear

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  return (
    <section className="rounded-3xl bg-white p-4 shadow-lg shadow-slate-200/70">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 transition"
          onClick={prevMonth}
        >
          ‹
        </button>
        <h2 className="font-bold text-slate-900">
          {year}年 {month + 1}月
        </h2>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 transition"
          onClick={nextMonth}
        >
          ›
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
        {DAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day, i) =>
          day === null ? (
            <span key={`empty-${i}`} />
          ) : (
            <button
              key={day}
              type="button"
              className={`aspect-square rounded-xl text-sm font-medium transition ${
                isToday(day)
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              {day}
            </button>
          )
        )}
      </div>
    </section>
  )
}

export default Calendar

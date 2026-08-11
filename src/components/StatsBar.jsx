/** @param {object} props */
function StatsBar({ title, total, done, rate, username, onLogout }) {
  return (
    <div className="stats-bar">
      <span className="title">{title}</span>
      <div className="stat">
        <span className="stat-value">{total}</span>
        <span className="stat-label">全部任务</span>
      </div>
      <div className="stat">
        <span className="stat-value">{done}</span>
        <span className="stat-label">已完成</span>
      </div>
      <div className="stat">
        <span className="stat-value">{rate}</span>
        <span className="stat-label">完成率</span>
      </div>
      {username && (
        <>
          <div className="stat">
            <span className="stat-value" style={{ fontSize: 14 }}>{username}</span>
            <span className="stat-label">当前用户</span>
          </div>
          <button className="btn btn-secondary" onClick={onLogout} style={{ marginLeft: 'auto' }}>
            退出登录
          </button>
        </>
      )}
    </div>
  )
}

export default StatsBar

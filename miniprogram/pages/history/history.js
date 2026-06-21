const app = getApp()

Page({
  data: { orders: [], loading: true },

  onShow() { this.loadOrders() },

  async loadOrders() {
    this.setData({ loading: true })
    try {
      await app.fetchOrders()
    } catch (e) { console.error(e) }
    // 统一格式化所有订单的日期（兼容云数据库和本地存储）
    const orders = (app.globalData.orders || []).map(o => this.formatOrder(o))
    this.setData({ orders })
    this.setData({ loading: false })
  },

  formatOrder(o) {
    const t = o.createdAt
    let d = null
    if (t) {
      if (typeof t === 'object' && t.$date) d = new Date(t.$date)
      else { const _d = new Date(t); if (!isNaN(_d.getTime())) d = _d }
    }
    return {
      ...o,
      _dayStr: d ? String(d.getDate()) : '',
      _monthStr: d ? (d.getMonth() + 1) + '月' : '',
      _weekdayStr: d ? ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()] : '',
      _timeStr: d ? String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') : ''
    }
  },

  goHome() { wx.navigateBack() },

  parseDate(t) {
    if (!t) return null
    if (typeof t === 'object' && t.$date) {
      return new Date(t.$date)
    }
    const d = new Date(t)
    return isNaN(d.getTime()) ? null : d
  },

  formatDay(t) {
    const d = this.parseDate(t)
    return d ? d.getDate() : ''
  },

  formatMonth(t) {
    const d = this.parseDate(t)
    return d ? (d.getMonth() + 1) + '月' : ''
  },

  formatWeekday(t) {
    const d = this.parseDate(t)
    if (!d) return ''
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[d.getDay()]
  },

  formatTime(t) {
    const d = this.parseDate(t)
    if (!d) return ''
    const hour = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${hour}:${min}`
  }
})

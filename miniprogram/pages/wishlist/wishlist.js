const app = getApp()

Page({
  data: { dishes: [], note: '' },

  onShow() { this.setData({ dishes: [...(app.globalData.selectedDishes || [])], note: '' }) },

  removeDish(e) {
    const idx = e.currentTarget.dataset.index
    const dish = this.data.dishes[idx]
    app.globalData.selectedDishes.splice(idx, 1)
    const t = app.globalData.dishes.find(d => d.id === dish.id)
    if (t) t.selected = false
    this.setData({ dishes: [...app.globalData.selectedDishes] })
  },

  onNoteInput(e) { this.setData({ note: e.detail.value }) },

  submitOrder() {
    if (app.globalData.selectedDishes.length === 0) { wx.showToast({ title: '还没选菜呢～', icon: 'none' }); return }
    wx.showModal({
      title: '确认提交', content: '告诉大厨做这些菜？',
      success: (r) => { if (r.confirm) this.doSubmit() }
    })
  },

  async doSubmit() {
    try {
      await app.submitOrder(app.globalData.selectedDishes, this.data.note)
      wx.showToast({ title: '已告诉大厨啦 🎉', icon: 'none', duration: 2000 })
      app.globalData.selectedDishes = []
      app.globalData.dishes.forEach(d => { d.selected = false })
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (e) { wx.showToast({ title: '提交失败', icon: 'none' }) }
  },

  goBack() { wx.navigateBack() },
  getColor(c) { return { noodle: '#FFE8E0', rice: '#E0F0E8', feast: '#FFE0E0' }[c] || '#F0F0F0' },
  getEmoji(c) { return { noodle: '🍜', rice: '🍚', feast: '🍗' }[c] || '🍽️' },
  getCateName(c) { return { noodle: '吃面', rice: '吃米', feast: '大餐' }[c] || '' }
})

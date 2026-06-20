const app = getApp()

Page({
  data: {
    dishes: [],
    note: ''
  },

  onShow() {
    this.setData({
      dishes: [...(app.globalData.selectedDishes || [])],
      note: ''
    })
  },

  // 移除菜品
  removeDish(e) {
    const idx = e.currentTarget.dataset.index
    const dish = this.data.dishes[idx]

    // 从心愿单中移除
    app.globalData.selectedDishes.splice(idx, 1)
    app.saveSelected()

    // 同步重置菜品选中状态
    const target = app.globalData.dishes.find(d => d.id === dish.id)
    if (target) {
      target.selected = false
      app.saveDishes()
    }

    this.setData({ dishes: [...app.globalData.selectedDishes] })
  },

  // 备注输入
  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  // 提交点餐
  submitOrder() {
    const selected = app.globalData.selectedDishes
    if (selected.length === 0) {
      wx.showToast({ title: '还没选菜呢～', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认提交',
      content: `告诉大厨做这些菜？`,
      success: (res) => {
        if (res.confirm) {
          this.doSubmit()
        }
      }
    })
  },

  doSubmit() {
    const selected = app.globalData.selectedDishes
    const order = {
      id: Date.now(),
      items: [...selected],
      note: this.data.note,
      createdAt: new Date().toLocaleString('zh-CN'),
      status: 'pending'
    }

    if (!app.globalData.orders) app.globalData.orders = []
    app.globalData.orders.unshift(order)
    wx.setStorageSync('homebite_orders', app.globalData.orders)

    // 清空心愿单
    app.globalData.selectedDishes = []
    app.globalData.dishes.forEach(d => { d.selected = false })
    app.saveDishes()
    app.saveSelected()

    wx.showToast({
      title: '已告诉大厨啦 🎉',
      icon: 'none',
      duration: 2000,
      complete: () => {
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  },

  goBack() {
    wx.navigateBack()
  },

  // helper
  getColor(cate) {
    return { noodle: '#FFE8E0', rice: '#E0F0E8', feast: '#FFE0E0' }[cate] || '#F0F0F0'
  },

  getEmoji(cate) {
    return { noodle: '🍜', rice: '🍚', feast: '🍗' }[cate] || '🍽️'
  },

  getCateName(cate) {
    return { noodle: '吃面', rice: '吃米', feast: '大餐' }[cate] || ''
  }
})

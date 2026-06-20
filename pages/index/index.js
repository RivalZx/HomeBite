const app = getApp()

Page({
  data: {
    currentCategory: 'noodle',
    familyName: '兜兜家',
    carousels: [],
    filteredDishes: [],
    selectedCount: 0
  },

  onLoad() {
    this.filterDishes()
    this.buildCarousel()
  },

  onShow() {
    // 每次回到首页重新加载数据（可能在其他页面修改了菜品）
    this.filterDishes()
    this.updateSelectedCount()
    this.buildCarousel()
  },

  // 根据当前分类过滤菜品
  filterDishes() {
    const dishes = app.globalData.dishes || []
    const filtered = dishes.filter(d => d.category === this.data.currentCategory)
    this.setData({ filteredDishes: filtered })
  },

  // 切换分类
  switchCategory(e) {
    const cate = e.currentTarget.dataset.cate
    this.setData({ currentCategory: cate })
    this.filterDishes()
  },

  // 选中/取消选中菜品
  toggleDish(e) {
    const id = e.currentTarget.dataset.id
    const dishes = app.globalData.dishes
    const dish = dishes.find(d => d.id === id)
    if (!dish) return

    dish.selected = !dish.selected

    // 同步心愿单
    if (dish.selected) {
      app.globalData.selectedDishes.push({
        id: dish.id,
        name: dish.name,
        imageUrl: dish.imageUrl,
        category: dish.category,
        note: ''
      })
    } else {
      const idx = app.globalData.selectedDishes.findIndex(s => s.id === id)
      if (idx > -1) app.globalData.selectedDishes.splice(idx, 1)
    }

    app.saveDishes()
    app.saveSelected()
    this.filterDishes()
    this.updateSelectedCount()
  },

  // 从有照片的菜品构建轮播
  buildCarousel() {
    const dishes = app.globalData.dishes || []
    const withImg = dishes.filter(d => d.imageUrl)
    if (withImg.length > 0) {
      // 每张菜品照片做成轮播项，显示菜名
      const slides = withImg.map(d => ({
        imageUrl: d.imageUrl,
        color: '#FFFDF8',
        label: `${d.name}`
      }))
      this.setData({ carousels: slides })
    } else {
      // 没照片时显示默认提示
      this.setData({
        carousels: [
          { imageUrl: '', color: '#FFC5C9', label: '🍜 上传菜品照片后这里会轮播哦' },
          { imageUrl: '', color: '#B6F0C0', label: '📸 加一道菜，拍张照吧' },
        ]
      })
    }
  },

  // 更新已选数量
  updateSelectedCount() {
    this.setData({ selectedCount: app.globalData.selectedDishes.length })
  },

  // 长按编辑菜品
  editDish(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/add-dish/add-dish?id=${id}`
    })
  },

  // 去添加菜品
  goAddDish() {
    wx.navigateTo({
      url: `/pages/add-dish/add-dish?category=${this.data.currentCategory}`
    })
  },

  // 去心愿单
  goWishlist() {
    if (app.globalData.selectedDishes.length === 0) {
      wx.showToast({ title: '还没选菜呢～', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/wishlist/wishlist' })
  },

  // 提交点餐
  submitOrder() {
    const selected = app.globalData.selectedDishes
    if (selected.length === 0) {
      wx.showToast({ title: '选几道菜再提交吧～', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认提交',
      content: `今天想吃 ${selected.map(s => s.name).join('、')} 吗？`,
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
      createdAt: new Date().toLocaleString('zh-CN'),
      status: 'pending',
      note: ''
    }

    // 保存订单
    if (!app.globalData.orders) app.globalData.orders = []
    app.globalData.orders.unshift(order)
    wx.setStorageSync('homebite_orders', app.globalData.orders)

    // 清空心愿单
    app.globalData.selectedDishes = []
    app.globalData.dishes.forEach(d => { d.selected = false })
    app.saveDishes()
    app.saveSelected()

    // 显示成功
    wx.showToast({
      title: '已告诉大厨啦 🎉',
      icon: 'none',
      duration: 2000
    })

    this.setData({ selectedCount: 0 })
    this.filterDishes()
  },

  // 去历史记录
  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  // 轮播切换
  onSwiperChange(e) {
    // 预留：可记录轮播曝光
  },

  // 默认菜品占位图背景色
  defaultDishBg(category) {
    const colors = {
      noodle: '#FFE8E0',
      rice: '#E0F0E8',
      feast: '#FFE0E0'
    }
    return colors[category] || '#F0F0F0'
  },

  // 默认菜品占位 emoji
  defaultDishEmoji(category) {
    const emojis = {
      noodle: '🍜',
      rice: '🍚',
      feast: '🍗'
    }
    return emojis[category] || '🍽️'
  }
})

const app = getApp()

Page({
  data: {
    currentCategory: 'noodle',
    familyName: '兜兜家',
    carousels: [],
    filteredDishes: [],
    selectedCount: 0,
    loading: true
  },

  onLoad() { this.loadData() },
  onShow() { this.loadData() },

  async loadData() {
    this.setData({ loading: true })
    // 先尝试从云数据库加载，失败也没关系，默认数据兜底
    try {
      await app.fetchDishes()
    } catch (e) {
      console.error('云加载失败，使用默认数据', e)
    }
    // 无论云加载成功还是失败，都渲染页面
    this.buildCarousel()
    this.filterDishes()
    this.updateSelectedCount()
    this.setData({ loading: false })
  },

  buildCarousel() {
    const dishes = app.globalData.dishes
    const withImg = dishes.filter(d => d.imageUrl)
    if (withImg.length > 0) {
      this.setData({ carousels: withImg.map(d => ({ imageUrl: d.imageUrl, label: d.name })) })
    } else {
      this.setData({ carousels: [
        { imageUrl: '', emoji: '📸', label: '上传照片后轮播' },
        { imageUrl: '', emoji: '🍜', label: '今天想吃什么？' },
      ]})
    }
  },

  filterDishes() {
    const dishes = app.globalData.dishes || []
    dishes.forEach(d => { d.selected = app.globalData.selectedDishes.some(s => s.id === d.id) })
    this.setData({ filteredDishes: dishes.filter(d => d.category === this.data.currentCategory) })
  },

  switchCategory(e) {
    this.setData({ currentCategory: e.currentTarget.dataset.cate })
    this.filterDishes()
  },

  toggleDish(e) {
    const id = e.currentTarget.dataset.id
    const dish = app.globalData.dishes.find(d => d.id === id)
    if (!dish) return
    dish.selected = !dish.selected
    if (dish.selected) {
      app.globalData.selectedDishes.push({ id, name: dish.name, imageUrl: dish.imageUrl, category: dish.category, note: '' })
    } else {
      const idx = app.globalData.selectedDishes.findIndex(s => s.id === id)
      if (idx > -1) app.globalData.selectedDishes.splice(idx, 1)
    }
    this.filterDishes()
    this.updateSelectedCount()
  },

  updateSelectedCount() { this.setData({ selectedCount: app.globalData.selectedDishes.length }) },

  editDish(e) { wx.navigateTo({ url: `/pages/add-dish/add-dish?id=${e.currentTarget.dataset.id}` }) },
  goAddDish() { wx.navigateTo({ url: `/pages/add-dish/add-dish?category=${this.data.currentCategory}` }) },
  goHistory() { wx.navigateTo({ url: '/pages/history/history' }) },

  goWishlist() {
    if (app.globalData.selectedDishes.length === 0) { wx.showToast({ title: '还没选菜呢～', icon: 'none' }); return }
    wx.navigateTo({ url: '/pages/wishlist/wishlist' })
  },

  submitOrder() {
    const s = app.globalData.selectedDishes
    if (s.length === 0) { wx.showToast({ title: '选几道菜再提交吧～', icon: 'none' }); return }
    wx.showModal({
      title: '确认提交',
      content: `今天想吃 ${s.map(i => i.name).join('、')} 吗？`,
      success: (r) => { if (r.confirm) this.doSubmit() }
    })
  },

  async doSubmit() {
    try {
      await app.submitOrder(app.globalData.selectedDishes, '')
      wx.showToast({ title: '已告诉大厨啦 🎉', icon: 'none', duration: 2000 })
      app.globalData.selectedDishes = []
      app.globalData.dishes.forEach(d => { d.selected = false })
      this.setData({ selectedCount: 0 })
      this.filterDishes()
    } catch (e) { wx.showToast({ title: '提交失败', icon: 'none' }) }
  },

  // 轮播图加载失败时，显示默认占位
  onCarouselImgError(e) {
    const idx = e.currentTarget.dataset.index
    const carousels = [...this.data.carousels]
    if (carousels[idx]) {
      carousels[idx] = { imageUrl: '', emoji: '📸', label: carousels[idx].label || '' }
      this.setData({ carousels })
    }
  },

  // 菜品图片加载失败时，显示 emoji 占位
  onDishImgError(e) {
    const id = e.currentTarget.dataset.id
    const dish = app.globalData.dishes.find(d => d.id === id)
    if (dish) {
      dish.imageUrl = ''
      this.filterDishes()
    }
  },

  cateBg(c) { return { noodle: '#FFE8E0', rice: '#E0F0E8', feast: '#FFE0E0' }[c] || '#F0F0F0' },
  cateEmoji(c) { return { noodle: '🍜', rice: '🍚', feast: '🍗' }[c] || '🍽️' }
})

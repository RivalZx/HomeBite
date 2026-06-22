const app = getApp()

Page({
  data: {
    currentCategory: 'noodle',
    familyName: '我的家',
    carousels: [],
    filteredDishes: [],
    selectedCount: 0,
    loading: true,
    drawerOpen: false,
    isChef: false,
    currentUser: {
      nickname: '我',
      avatar: '👤',
      role: '成员'
    }
  },

  onLoad() { this.loadData() },
  onShow() { this.loadData() },

  async loadData() {
    if (this._loading) return
    this._loading = true
    this.setData({ loading: true })

    const gu = app.globalData
    if (gu.familyId) {
      this.setData({
        familyName: gu.familyName || '我的家',
        isChef: gu.currentUser.isChef || false,
        currentUser: {
          nickname: gu.currentUser.nickname || '我',
          avatar: gu.currentUser.avatar || '👤',
          avatarUrl: gu.currentUser.avatarUrl || '',
          role: gu.currentUser.isChef ? '厨师' : '成员'
        }
      })
    }

    try { await app.fetchDishes() } catch (e) { console.error(e) }
    this.buildCarousel()
    this.filterDishes()
    this.updateSelectedCount()
    this._loading = false
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
        { imageUrl: '', emoji: '🍜', label: '今天想吃什么？' }
      ]})
    }
  },

  filterDishes() {
    const dishes = app.globalData.dishes || []
    dishes.forEach(d => {
      d.selected = app.globalData.selectedDishes.some(s => s.id === d.id)
      if (d.imgLoaded === undefined) d.imgLoaded = false
    })
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

  editDish(e) {
    if (!this.data.isChef) { wx.showToast({ title: '只有厨师可以编辑', icon: 'none' }); return }
    wx.navigateTo({ url: `/pages/add-dish/add-dish?id=${e.currentTarget.dataset.id}` })
  },

  goAddDish() {
    if (!this.data.isChef) { wx.showToast({ title: '只有厨师可以添加', icon: 'none' }); return }
    wx.navigateTo({ url: `/pages/add-dish/add-dish?category=${this.data.currentCategory}` })
  },

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

  // ===== 抽屉菜单 =====
  openDrawer() {
    const gu = app.globalData
    this.setData({
      drawerOpen: true,
      familyName: gu.familyName || '我的家',
      isChef: gu.currentUser.isChef || false,
      currentUser: {
        nickname: gu.currentUser.nickname || '我',
        avatar: gu.currentUser.avatar || '👤',
        avatarUrl: gu.currentUser.avatarUrl || '',
        role: gu.currentUser.isChef ? '厨师' : '成员'
      }
    })
  },

  closeDrawer() { this.setData({ drawerOpen: false }) },

  goMember() { this.closeDrawer(); wx.navigateTo({ url: '/pages/member/member' }) },

  goSettings() { this.closeDrawer(); wx.navigateTo({ url: '/pages/settings/settings' }) },

  inviteFamily() {
    this.closeDrawer()
    wx.showToast({ title: '点击右上角分享给家人', icon: 'none' })
  },

  onShareAppMessage() {
    return {
      title: '🏠 来 BiteMate 一起点餐吧！',
      path: '/pages/index/index',
      imageUrl: ''
    }
  },

  onCarouselImgError(e) {
    const idx = e.currentTarget.dataset.index
    const cs = [...this.data.carousels]
    if (cs[idx]) { cs[idx] = { imageUrl: '', emoji: '📸', label: cs[idx].label || '' }; this.setData({ carousels: cs }) }
  },

  onDishImgLoad(e) {
    const id = e.currentTarget.dataset.id
    const dish = app.globalData.dishes.find(d => d.id === id)
    if (dish) { dish.imgLoaded = true; this.filterDishes() }
  },

  onDishImgError(e) {
    const id = e.currentTarget.dataset.id
    const dish = app.globalData.dishes.find(d => d.id === id)
    if (dish) { dish.imageUrl = ''; this.filterDishes() }
  },

  cateBg(c) { return { noodle: '#FFE8E0', rice: '#E0F0E8', feast: '#FFE0E0' }[c] || '#F0F0F0' },
  cateEmoji(c) { return { noodle: '🍜', rice: '🍚', feast: '🍗' }[c] || '🍽️' }
})

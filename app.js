App({
  globalData: {
    currentFamily: '我们家',
    currentCategory: 'noodle',
    dishes: [
      // 吃面！
      { id: 1, name: '红烧牛肉面', category: 'noodle', imageUrl: '', note: '', selected: false },
      { id: 2, name: '番茄鸡蛋面', category: 'noodle', imageUrl: '', note: '', selected: false },
      { id: 3, name: '酸辣粉', category: 'noodle', imageUrl: '', note: '', selected: false },
      { id: 4, name: '鲜肉馄饨', category: 'noodle', imageUrl: '', note: '', selected: false },
      { id: 5, name: '葱油拌面', category: 'noodle', imageUrl: '', note: '', selected: false },
      { id: 6, name: '韭菜饺子', category: 'noodle', imageUrl: '', note: '', selected: false },
      // 吃米！
      { id: 7, name: '蛋炒饭', category: 'rice', imageUrl: '', note: '', selected: false },
      { id: 8, name: '黄焖鸡米饭', category: 'rice', imageUrl: '', note: '', selected: false },
      { id: 9, name: '腊味煲仔饭', category: 'rice', imageUrl: '', note: '', selected: false },
      { id: 10, name: '咖喱鸡肉饭', category: 'rice', imageUrl: '', note: '', selected: false },
      { id: 11, name: '皮蛋瘦肉粥', category: 'rice', imageUrl: '', note: '', selected: false },
      { id: 12, name: '照烧鸡腿饭', category: 'rice', imageUrl: '', note: '', selected: false },
      // 大餐！
      { id: 13, name: '水煮鱼', category: 'feast', imageUrl: '', note: '', selected: false },
      { id: 14, name: '红烧排骨', category: 'feast', imageUrl: '', note: '', selected: false },
      { id: 15, name: '蒜蓉粉丝虾', category: 'feast', imageUrl: '', note: '', selected: false },
      { id: 16, name: '宫保鸡丁', category: 'feast', imageUrl: '', note: '', selected: false },
    ],
    selectedDishes: [],
    orders: []
  },

  onLaunch() {
    // 从本地存储恢复数据
    const dishes = wx.getStorageSync('homebite_dishes')
    if (dishes) {
      // 清理旧版本中无效的文件路径（现在改用 base64 存储，非 base64 的旧路径清掉）
      let needsSave = false
      dishes.forEach(d => {
        if (d.imageUrl && !d.imageUrl.startsWith('data:image/')) {
          d.imageUrl = ''
          needsSave = true
        }
      })
      if (needsSave) {
        wx.setStorageSync('homebite_dishes', dishes)
      }
      this.globalData.dishes = dishes
    }
    const selected = wx.getStorageSync('homebite_selected')
    if (selected) {
      this.globalData.selectedDishes = selected
      // 恢复选中状态
      this.globalData.dishes.forEach(d => {
        d.selected = selected.some(s => s.id === d.id)
      })
    }
  },

  saveDishes() {
    wx.setStorageSync('homebite_dishes', this.globalData.dishes)
  },

  saveSelected() {
    wx.setStorageSync('homebite_selected', this.globalData.selectedDishes)
  }
})

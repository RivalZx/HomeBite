let db = null

App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloudbase-d6gp330aj22d1be92',
      traceUser: true
    })
    db = wx.cloud.database()

    // 检查用户是否有家庭缓存，有则表明已处理过欢迎页
    const saved = wx.getStorageSync('hb_user')
    if (saved && saved.familyId && saved.familyId !== 'default') {
      this.globalData.openid = saved.openid || ''
      this.globalData.familyId = saved.familyId
      this.globalData.familyName = saved.familyName || '我的家'
      this.globalData.currentUser = saved.currentUser || {
        nickname: '我', avatar: '👤', avatarUrl: '', role: 'member', isLoggedIn: true, isChef: false
      }
    }
  },

  globalData: {
    openid: '',
    familyId: 'default',
    currentUser: {
      nickname: '我',
      avatar: '👤',
      avatarUrl: '',
      role: 'member',
      isLoggedIn: false,
      isChef: false
    },
    familyName: "我的家",
    // 默认菜品数据，云数据库加载成功后会覆盖
    dishes: [
      { id: 'default_1', name: '红烧牛肉面', category: 'noodle', imageUrl: '', note: '', selected: false },
      { id: 'default_2', name: '番茄鸡蛋面', category: 'noodle', imageUrl: '', note: '', selected: false },
      { id: 'default_3', name: '酸辣粉', category: 'noodle', imageUrl: '', note: '', selected: false },
      { id: 'default_4', name: '葱油拌面', category: 'noodle', imageUrl: '', note: '', selected: false },
      { id: 'default_5', name: '蛋炒饭', category: 'rice', imageUrl: '', note: '', selected: false },
      { id: 'default_6', name: '黄焖鸡米饭', category: 'rice', imageUrl: '', note: '', selected: false },
      { id: 'default_7', name: '腊味煲仔饭', category: 'rice', imageUrl: '', note: '', selected: false },
      { id: 'default_8', name: '咖喱鸡肉饭', category: 'rice', imageUrl: '', note: '', selected: false },
      { id: 'default_9', name: '水煮鱼', category: 'feast', imageUrl: '', note: '', selected: false },
      { id: 'default_10', name: '红烧排骨', category: 'feast', imageUrl: '', note: '', selected: false },
      { id: 'default_11', name: '宫保鸡丁', category: 'feast', imageUrl: '', note: '', selected: false },
    ],
    selectedDishes: [],
    orders: [],
    pendingInvite: '',
    isLoggingIn: false
  },

  // 获取微信 openid（不处理家庭，家庭由 welcome 页面处理）
  login() {
    return new Promise((resolve) => {
      const saved = wx.getStorageSync('hb_user')
      if (saved && saved.openid) {
        this.globalData.openid = saved.openid
        resolve(saved)
        return
      }
      wx.login({
        success: () => {
          wx.cloud.callFunction({
            name: 'login',
            data: {},
            success: (res) => {
              const data = res.result
              this.globalData.openid = data.openid
              resolve(data)
            },
            fail: () => resolve(null)
          })
        },
        fail: () => resolve(null)
      })
    })
  },

  fetchDishes() {
    return db.collection('dishes')
      .where({ familyId: this.globalData.familyId })
      .orderBy('createdAt', 'asc')
      .get()
      .then(res => {
        const dishes = res.data.map(d => ({
          id: d._id,
          name: d.name,
          category: d.category,
          imageUrl: d.imageUrl || '',
          note: d.note || '',
          selected: false,
          sortOrder: d.sortOrder || 0
        }));
        // 批量将 cloud:// 图片 URL 转为 HTTP 临时链接
        return this.resolveCloudUrls(dishes)
      })
      .catch(err => {
        console.error('fetchDishes 云读取失败，使用本地数据', err)
        // 从本地 storage 恢复
        const local = wx.getStorageSync('hb_dishes')
        if (local && local.length > 0) {
          this.globalData.dishes = local
        }
        return this.globalData.dishes
      })
  },

  addDish(dish) {
    return db.collection('dishes').add({
      data: {
        familyId: this.globalData.familyId,
        name: dish.name,
        category: dish.category,
        imageUrl: dish.imageUrl || '',
        note: dish.note || '',
        sortOrder: dish.sortOrder || 0,
        createdAt: db.serverDate()
      }
    }).then(res => {
      // 云保存成功后，立即同步到本地列表
      const newDish = { ...dish, id: res._id, selected: false }
      this.globalData.dishes.push(newDish)
      // 异步转换 cloud:// 为 HTTP 链接（不影响保存返回）
      if (newDish.imageUrl && newDish.imageUrl.startsWith('cloud://')) {
        wx.cloud.getTempFileURL({ fileList: [newDish.imageUrl] }).then(r => {
          if (r.fileList && r.fileList[0]) {
            newDish.imageUrl = r.fileList[0].tempFileURL
          }
        }).catch(() => {})
      }
      return res
    }).catch(err => {
      console.error('addDish 云写入失败，降级到本地', err)
      // 降级：写入本地 storage
      const localDish = {
        ...dish,
        id: 'local_' + Date.now(),
        selected: false
      }
      this.globalData.dishes.push(localDish)
      wx.setStorageSync('hb_dishes', this.globalData.dishes)
      return localDish
    })
  },

  updateDish(id, data) {
    return db.collection('dishes').doc(id).update({ data }).catch(err => {
      console.error('updateDish 云失败，降级到本地', err)
      const dish = this.globalData.dishes.find(d => d.id === id)
      if (dish) {
        Object.assign(dish, data)
        wx.setStorageSync('hb_dishes', this.globalData.dishes)
      }
    })
  },

  deleteDish(id) {
    return db.collection('dishes').doc(id).remove().catch(err => {
      console.error('deleteDish 云失败，降级到本地', err)
      const idx = this.globalData.dishes.findIndex(d => d.id === id)
      if (idx > -1) {
        this.globalData.dishes.splice(idx, 1)
        wx.setStorageSync('hb_dishes', this.globalData.dishes)
      }
    })
  },

  submitOrder(items, note) {
    const who = this.globalData.currentUser.nickname || '我'
    return db.collection('orders').add({
      data: {
        familyId: this.globalData.familyId,
        items: items.map(i => ({ name: i.name, category: i.category })),
        note: note || '',
        createdBy: this.globalData.openid,
        createdByName: who,
        status: 'pending',
        createdAt: db.serverDate()
      }
    }).catch(err => {
      console.error('submitOrder 云失败，降级到本地', err)
      const order = {
        id: 'local_order_' + Date.now(),
        items: items,
        note: note || '',
        createdByName: who,
        createdAt: new Date(),
        status: 'pending'
      }
      if (!this.globalData.orders) this.globalData.orders = []
      this.globalData.orders.unshift(order)
      wx.setStorageSync('hb_orders', this.globalData.orders)
    })
  },

  fetchOrders() {
    return db.collection('orders')
      .where({ familyId: this.globalData.familyId })
      .orderBy('createdAt', 'desc')
      .get()
      .then(res => {
        this.globalData.orders = res.data
        return res.data
      }).catch(err => {
        console.error('fetchOrders 云失败，使用本地数据', err)
        const local = wx.getStorageSync('hb_orders')
        if (local) this.globalData.orders = local
        return this.globalData.orders
      })
  },

  // 获取家庭成员列表
  fetchFamilyMembers(familyId) {
    return db.collection('family_members')
      .where({ familyId: familyId || this.globalData.familyId })
      .get()
      .then(res => res.data)
      .catch(err => {
        console.error('获取家庭成员失败', err)
        return []
      })
  },

  // 更新当前用户昵称和头像
  updateUserInfo(nickname, avatarUrl) {
    this.globalData.currentUser.nickname = nickname
    this.globalData.currentUser.avatarUrl = avatarUrl
    const saved = wx.getStorageSync('hb_user') || {}
    saved.currentUser = this.globalData.currentUser
    wx.setStorageSync('hb_user', saved)

    // 同步到云数据库
    db.collection('family_members')
      .where({ openid: this.globalData.openid })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          db.collection('family_members').doc(res.data[0]._id).update({
            data: { nickname, avatar: avatarUrl }
          })
        }
      })
      .catch(() => {})
  },

  getDb() {
    return db
  },

  // 将 cloud:// 图片 URL 转为 HTTP 临时链接（确保在所有小程序组件中可显示）
  resolveCloudUrls(dishes) {
    const cloudUrls = dishes.filter(d => d.imageUrl && d.imageUrl.startsWith('cloud://'))
    if (cloudUrls.length === 0) {
      this.globalData.dishes = dishes
      return dishes
    }

    const fileIDs = cloudUrls.map(d => d.imageUrl)
    return wx.cloud.getTempFileURL({
      fileList: fileIDs
    }).then(res => {
      const urlMap = {}
      res.fileList.forEach(item => {
        urlMap[item.fileID] = item.tempFileURL
      })
      dishes.forEach(d => {
        if (d.imageUrl && urlMap[d.imageUrl]) {
          d.imageUrl = urlMap[d.imageUrl]
        }
      })
      this.globalData.dishes = dishes
      return dishes
    }).catch(err => {
      console.error('转换图片URL失败，使用原始URL', err)
      this.globalData.dishes = dishes
      return dishes
    })
  }
})

// db 现在在 onLaunch 里初始化，不再在文件底部定义


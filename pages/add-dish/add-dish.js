const app = getApp()

Page({
  data: {
    isEdit: false,
    editId: null,
    imageUrl: '',
    dishName: '',
    category: 'noodle',
    note: '',
    canSave: false
  },

  onLoad(options) {
    // 如果有 id 说明是编辑模式
    if (options.id) {
      const id = parseInt(options.id)
      const dish = app.globalData.dishes.find(d => d.id === id)
      if (dish) {
        this.setData({
          isEdit: true,
          editId: id,
          imageUrl: dish.imageUrl,
          dishName: dish.name,
          category: dish.category,
          note: dish.note || '',
          canSave: !!dish.name
        })
        wx.setNavigationBarTitle({ title: '编辑菜品' })
      }
    } else if (options.category) {
      // 默认分类
      this.setData({ category: options.category })
    }
  },

  // 选择照片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0]
        // 将图片转为 base64 存储，避免本地文件路径失效
        const fs = wx.getFileSystemManager()
        fs.readFile({
          filePath: tempPath,
          encoding: 'base64',
          success: (readRes) => {
            const base64 = 'data:image/jpeg;base64,' + readRes.data
            this.setData({
              imageUrl: base64
            })
            this.checkCanSave()
          },
          fail: () => {
            // 降级：直接用临时路径
            this.setData({
              imageUrl: tempPath
            })
            this.checkCanSave()
          }
        })
      }
    })
  },

  // 输入菜名
  onNameInput(e) {
    this.setData({ dishName: e.detail.value })
    this.checkCanSave()
  },

  // 选择分类
  selectCategory(e) {
    this.setData({ category: e.currentTarget.dataset.cate })
  },

  // 备注输入
  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  // 检查能否保存
  checkCanSave() {
    this.setData({
      canSave: !!this.data.dishName.trim()
    })
  },

  // 保存
  saveDish() {
    if (!this.data.canSave) {
      wx.showToast({ title: '菜名不能为空', icon: 'none' })
      return
    }

    if (this.data.isEdit) {
      // 编辑模式：更新现有菜品
      const dish = app.globalData.dishes.find(d => d.id === this.data.editId)
      if (dish) {
        dish.name = this.data.dishName.trim()
        dish.category = this.data.category
        dish.note = this.data.note
        if (this.data.imageUrl && !this.data.imageUrl.startsWith('http')) {
          dish.imageUrl = this.data.imageUrl
        }
        app.saveDishes()
        wx.showToast({ title: '已更新 🎉', icon: 'none' })
      }
    } else {
      // 新增模式
      const newId = Date.now() + Math.floor(Math.random() * 1000)
      const newDish = {
        id: newId,
        name: this.data.dishName.trim(),
        category: this.data.category,
        imageUrl: this.data.imageUrl,
        note: this.data.note,
        selected: false
      }
      app.globalData.dishes.push(newDish)
      app.saveDishes()
      wx.showToast({ title: '已加入菜单 🎉', icon: 'none' })
    }

    setTimeout(() => {
      wx.navigateBack()
    }, 1200)
  },

  // 删除菜品
  deleteDish() {
    wx.showModal({
      title: '确定删除？',
      content: '删了可就没了哦',
      success: (res) => {
        if (res.confirm) {
          const idx = app.globalData.dishes.findIndex(d => d.id === this.data.editId)
          if (idx > -1) {
            app.globalData.dishes.splice(idx, 1)
            app.saveDishes()
            wx.showToast({ title: '已删除', icon: 'none' })
            setTimeout(() => { wx.navigateBack() }, 1000)
          }
        }
      }
    })
  }
})

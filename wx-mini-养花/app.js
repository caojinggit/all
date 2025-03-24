// app.js
App({
  globalData: {
    plant: {
      name: '小绿植',
      stage: 0,
      growthPoints: 0,
      water: 50,
      fertilizer: 50,
      bugs: 0,
      health: 100,
      lastGrowthCheck: Date.now()
    },
    dailyActions: {
      water: 999,
      fertilize: 999,
      removeBugs: 999
    },
    achievements: {
      reachStage3: false,
      reachStage5: false
    }
  },
  
  onLaunch() {
    // 初始化时尝试读取本地存储
    const plant = wx.getStorageSync('plant');
    const dailyActions = wx.getStorageSync('dailyActions');
    const achievements = wx.getStorageSync('achievements');
    
    if (plant) this.globalData.plant = plant;
    if (dailyActions) this.globalData.dailyActions = dailyActions;
    if (achievements) this.globalData.achievements = achievements;
  }
})
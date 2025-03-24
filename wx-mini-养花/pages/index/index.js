// index.js
Page({
  data: {
    plant: {},
    dailyActions: {},
    growthProgress: 0
  },

  onLoad: function() {
    // 初始化页面数据
    this.initPageData();
    // 设置定时器，每分钟检查一次植物状态
    this.startPlantTimer();
  },

  onShow: function() {
    // 每次显示页面时更新数据
    this.initPageData();
  },

  onShareAppMessage: function() {
    return {
      title: `我的${this.data.plant.name}已经成长到第${this.data.plant.stage + 1}阶段啦！`,
      path: '/pages/index/index'
    };
  },

  // 初始化页面数据
  initPageData: function() {
    const app = getApp();
    if (!app) {
      console.error('应用实例未初始化');
      return;
    }
    // 获取全局数据
    const plant = app.globalData.plant;
    const dailyActions = app.globalData.dailyActions;
    
    // 计算成长进度
    let growthProgress = 0;
    if (plant.stage < 4) {
      // 每个阶段需要100点成长值
      // 计算当前阶段的实际进度，而不是总成长点数的余数
      growthProgress = plant.growthPoints - (plant.stage * 100);
    } else {
      growthProgress = 100; // 最终阶段
    }
    
    this.setData({
      plant: plant,
      dailyActions: dailyActions,
      growthProgress: growthProgress
    });
    
    // 检查植物状态变化
    this.checkPlantStatus();
    // 添加花朵的特效和动画
    this.animateFlower();
  },

  // 增强：花朵动画函数
  animateFlower: function() {
    // 创建更丰富的花朵动画
    const animation = wx.createAnimation({
      duration: 1500,
      timingFunction: 'ease-in-out',
    });
    
    // 随机选择一种动画效果
    const effectType = Math.floor(Math.random() * 3);
    
    switch(effectType) {
      case 0: // 放大缩小效果
        animation.scale(1.2).step().scale(1).step();
        break;
      case 1: // 旋转效果
        animation.rotate(10).step().rotate(-10).step().rotate(0).step();
        break;
      case 2: // 上下浮动效果
        animation.translateY(-10).step().translateY(0).step();
        break;
    }
    
    this.setData({
      flowerAnimation: animation.export()
    });
  },

  // 开始植物状态定时器
  startPlantTimer: function() {
    // 清除可能存在的旧定时器
    if (this.plantTimer) {
      clearInterval(this.plantTimer);
    }
    
    // 设置新定时器，每分钟检查一次
    this.plantTimer = setInterval(() => {
      this.checkPlantStatus();
    }, 60000); // 60秒
  },

  // 检查植物状态
  checkPlantStatus: function() {
    const app = getApp();
    if (!app) {
      console.error('应用实例未初始化');
      return;
    }
    const plant = app.globalData.plant;
    const now = Date.now();
    
    // 计算自上次检查以来经过的小时数
    const hoursPassed = (now - plant.lastGrowthCheck) / (1000 * 60 * 60);
    
    if (hoursPassed >= 1) {
      // 更新植物状态
      // 水分每小时减少1点（减少消耗速度）
      plant.water = Math.max(0, plant.water - 1 * hoursPassed);
      // 肥料每小时减少0.5点（减少消耗速度）
      plant.fertilizer = Math.max(0, plant.fertilizer - 0.5 * hoursPassed);
      // 随机生成虫害，每小时有10%概率
      if (Math.random() < 0.1 * hoursPassed && plant.bugs < 100) {
        plant.bugs = Math.min(100, plant.bugs + Math.floor(Math.random() * 20) + 10);
      }
      
      // 计算健康度
      this.calculateHealth();
      
      // 计算成长点数
      if (plant.health > 60 && plant.stage < 4) {
        // 健康度大于60时才能获得成长点数
        // 健康度越高，成长越快（大幅提高成长速度）
        const growthIncrease = Math.floor((plant.health / 100) * 20 * hoursPassed);
        plant.growthPoints += growthIncrease;
        
        // 检查是否升级到下一阶段
        if (plant.growthPoints >= (plant.stage + 1) * 100) {
          plant.stage = Math.min(4, plant.stage + 1);
          // 检查成就：达到第3阶段
          if (plant.stage >= 2 && !app.globalData.achievements.reachStage3) {
            app.globalData.achievements.reachStage3 = true;
            wx.showToast({
              title: '成就解锁：成长到第3阶段！',
              icon: 'none',
              duration: 2000
            });
          }
          // 检查成就：达到最终阶段
          if (plant.stage >= 4 && !app.globalData.achievements.reachStage5) {
            app.globalData.achievements.reachStage5 = true;
            wx.showToast({
              title: '成就解锁：成长到最终阶段！',
              icon: 'none',
              duration: 2000
            });
          }
        }
      }
      
      // 更新最后检查时间
      plant.lastGrowthCheck = now;
      
      // 保存数据
      app.globalData.plant = plant;
      wx.setStorageSync('plant', plant);
      wx.setStorageSync('achievements', app.globalData.achievements);
      
      // 更新页面数据
      this.initPageData();
    }
  },

  // 计算植物健康度
  calculateHealth: function() {
    const app = getApp();
    if (!app) {
      console.error('应用实例未初始化');
      return;
    }
    const plant = this.data.plant;
    let health = 100;
    
    // 水分影响
    if (plant.water < 20) {
      health -= 20;
    } else if (plant.water < 40) {
      health -= 10;
    } else if (plant.water > 80) {
      health -= 5; // 水太多也不好
    }
    
    // 肥料影响
    if (plant.fertilizer < 20) {
      health -= 15;
    } else if (plant.fertilizer < 40) {
      health -= 5;
    } else if (plant.fertilizer > 80) {
      health -= 10; // 肥料太多也不好
    }
    
    // 虫害影响
    if (plant.bugs > 0) {
      health -= Math.floor(plant.bugs / 10);
    }
    
    // 确保健康度在0-100之间
    plant.health = Math.max(0, Math.min(100, health));
    
    // 更新全局数据
    getApp().globalData.plant = plant;
  },

  // 浇水
  waterPlant: function() {
    const app = getApp();
    if (!app) {
      console.error('应用实例未初始化');
      return;
    }
    const plant = app.globalData.plant;
    
    // 增加水分
    plant.water = Math.min(100, plant.water + 30);
    
    // 更新健康度
    this.calculateHealth();
    
    // 计算成长点数
    this.updateGrowthPoints(plant);
    
    // 保存数据
    app.globalData.plant = plant;
    wx.setStorageSync('plant', plant);
    
    // 更新页面数据
    this.setData({
      plant: plant
    });
    
    // 显示提示
    wx.showToast({
      title: '浇水成功！',
      icon: 'success',
      duration: 1000
    });
    
    // 添加花朵的特效和动画
    this.animateFlower();
  },

  // 施肥
  fertilizePlant: function() {
    const app = getApp();
    if (!app) {
      console.error('应用实例未初始化');
      return;
    }
    const plant = app.globalData.plant;
    
    // 增加肥料
    plant.fertilizer = Math.min(100, plant.fertilizer + 25);
    
    // 更新健康度
    this.calculateHealth();
    
    // 计算成长点数
    this.updateGrowthPoints(plant);
    
    // 保存数据
    app.globalData.plant = plant;
    wx.setStorageSync('plant', plant);
    
    // 更新页面数据
    this.setData({
      plant: plant
    });
    
    // 显示提示
    wx.showToast({
      title: '施肥成功！',
      icon: 'success',
      duration: 1000
    });
    
    // 添加花朵的特效和动画
    this.animateFlower();
  },

  // 新增：更新成长点数的逻辑
  updateGrowthPoints: function(plant) {
    if (plant.health > 60 && plant.stage < 4) {
      // 健康度大于60时才能获得成长点数
      const growthIncrease = Math.floor((plant.health / 100) * 5); // 这里可以根据需要调整成长点数的计算
      plant.growthPoints += growthIncrease;

      // 检查是否升级到下一阶段
      if (plant.growthPoints >= (plant.stage + 1) * 100) {
        plant.stage = Math.min(4, plant.stage + 1);
        // 这里可以添加成就解锁的逻辑
      }
    }
  },

  // 除虫
  removeBugs: function() {
    if (this.data.plant.bugs <= 0) return;
    
    const app = getApp();
    if (!app) {
      console.error('应用实例未初始化');
      return;
    }
    const plant = app.globalData.plant;
    const dailyActions = app.globalData.dailyActions;
    
    // 减少虫害（完全清除虫害）
    plant.bugs = 0;
    
    // 更新健康度
    this.calculateHealth();
    
    // 保存数据
    app.globalData.plant = plant;
    app.globalData.dailyActions = dailyActions;
    app.globalData.lastActionTime = Date.now();
    
    wx.setStorageSync('plant', plant);
    wx.setStorageSync('dailyActions', dailyActions);
    wx.setStorageSync('lastActionTime', app.globalData.lastActionTime);
    
    // 更新页面数据
    this.setData({
      plant: plant,
      dailyActions: dailyActions
    });
    
    // 显示提示
    wx.showToast({
      title: '除虫成功！',
      icon: 'success',
      duration: 1000
    });
    
    // 检查成就：第一次操作
    if (!app.globalData.achievements.firstPlant) {
      app.globalData.achievements.firstPlant = true;
      wx.setStorageSync('achievements', app.globalData.achievements);
      wx.showToast({
        title: '成就解锁：第一次照料植物！',
        icon: 'none',
        duration: 2000
      });
    }
    
    // 检查成就：第一次除虫
    if (!app.globalData.achievements.firstRemoveBugs) {
      app.globalData.achievements.firstRemoveBugs = true;
      wx.setStorageSync('achievements', app.globalData.achievements);
      wx.showToast({
        title: '成就解锁：第一次除虫！',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 查看成就
  viewAchievements: function() {
    const app = getApp();
    if (!app) {
      console.error('应用实例未初始化');
      return;
    }
    wx.navigateTo({
      url: '/pages/achievements/achievements'
    });
  }
});
    
    
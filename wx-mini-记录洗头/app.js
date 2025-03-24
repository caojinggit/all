App({
  onLaunch: function() {
    // 检查是否有本地存储的洗头记录数据
    const washRecords = wx.getStorageSync('washRecords') || [];
    // 初始化全局数据
    this.globalData = {
      washRecords: washRecords,
      userInfo: null,
      theme: {
        primaryColor: '#FFB3C1', // 樱花粉
        secondaryColor: '#A8D8EA', // 天空蓝
        accentColor: '#FFD700' // 星月黄
      }
    };
  },
  
  // 添加洗头记录
  addWashRecord: function(record) {
    // 添加新记录
    this.globalData.washRecords.push(record);
    // 保存到本地存储
    wx.setStorageSync('washRecords', this.globalData.washRecords);
    return true;
  },
  
  // 获取洗头记录
  getWashRecords: function() {
    return this.globalData.washRecords;
  },
  
  // 获取指定月份的洗头次数
  getMonthWashCount: function(year, month) {
    return this.globalData.washRecords.filter(record => {
      // 确保record.date是字符串格式
      let recordDate;
      if (typeof record.date === 'string') {
        recordDate = new Date(record.date);
      } else if (record.date instanceof Date) {
        recordDate = record.date;
      } else {
        console.error('Invalid date format:', record.date);
        return false;
      }
      return recordDate.getFullYear() === year && recordDate.getMonth() === month;
    }).length;
  },
  
  // 获取本周的洗头次数
  getWeekWashCount: function() {
    // 获取本周的起始日期（周一）和结束日期（周日）
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? 6 : currentDay - 1; // 周日特殊处理
    
    // 计算本周一的日期
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);
    
    // 计算本周日的日期
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    // 筛选本周的洗头记录
    return this.globalData.washRecords.filter(record => {
      let recordDate;
      if (typeof record.date === 'string') {
        recordDate = new Date(record.date);
      } else if (record.date instanceof Date) {
        recordDate = record.date;
      } else {
        console.error('Invalid date format:', record.date);
        return false;
      }
      
      // 确保日期比较正确
      const recordTime = recordDate.getTime();
      const mondayTime = monday.getTime();
      const sundayTime = sunday.getTime();
      
      return recordTime >= mondayTime && recordTime <= sundayTime;
    }).length;
  },
  
  // 获取主题配色
  getTheme: function() {
    return this.globalData.theme;
  },
  
  globalData: {
    washRecords: [],
    userInfo: null,
    theme: {
      primaryColor: '#FFB3C1', // 樱花粉
      secondaryColor: '#A8D8EA', // 天空蓝
      accentColor: '#FFD700' // 星月黄
    }
  }
});
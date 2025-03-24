// statistics.js
Page({
  data: {
    totalWashCount: 0,
    monthWashCount: 0, // 本月洗头次数
    weekWashCount: 0, // 本周洗头次数
    averageInterval: 0,
    currentStreak: 0,
    shampooRemaining: 7, // 默认洗发水剩余量70%
    // 定时提醒相关数据
    reminderEnabled: false, // 是否开启提醒
    reminderTypeIndex: 0, // 提醒类型索引
    reminderTypes: ['每天提醒', '每周提醒', '每月提醒', '间隔天数提醒'],
    reminderTime: '20:00', // 默认提醒时间
    reminderWeekdayIndex: 0, // 每周几提醒（0-6，对应周日到周六）
    weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    reminderMonthDayIndex: 0, // 每月几号提醒（0-30，对应1-31号）
    monthDays: Array.from({length: 31}, (_, i) => i + 1), // 1-31号
    reminderIntervalIndex: 2, // 间隔天数索引
    intervalDays: [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30], // 可选间隔天数
    nextReminderDate: '', // 下次提醒日期
    badges: [
      { id: 1, name: '洗发新手', icon: '🧴', unlocked: true, description: '记录第一次洗发' },
      { id: 2, name: '泡泡达人', icon: '🫧', unlocked: false, description: '连续7天每天洗发' },
      { id: 3, name: '香香公主', icon: '👑', unlocked: false, description: '累计洗发30次' },
      { id: 4, name: '护发专家', icon: '💆‍♀️', unlocked: false, description: '使用3种不同的洗发产品' },
      { id: 5, name: '时间管理者', icon: '⏰', unlocked: false, description: '坚持记录洗发1个月' },
      { id: 6, name: '发丝守护者', icon: '✨', unlocked: false, description: '连续两周保持规律洗发' }
    ],
    stickers: [
      { id: 1, emoji: '🌸', collected: true },
      { id: 2, emoji: '🌈', collected: false },
      { id: 3, emoji: '🌟', collected: false },
      { id: 4, emoji: '🍭', collected: false },
      { id: 5, emoji: '🎀', collected: true },
      { id: 6, emoji: '🧁', collected: false },
      { id: 7, emoji: '🦄', collected: false },
      { id: 8, emoji: '🐱', collected: false },
      { id: 9, emoji: '🍓', collected: false }
    ]
  },

  onLoad: function() {
    this.loadStatistics();
    this.loadReminderSettings();
  },
  
  onShow: function() {
    // 每次页面显示时重新加载数据
    this.loadStatistics();
    this.loadReminderSettings();
  },
  
  // 加载提醒设置
  loadReminderSettings: function() {
    // 从本地存储加载提醒设置
    const reminderEnabled = wx.getStorageSync('reminderEnabled') || false;
    const reminderTypeIndex = wx.getStorageSync('reminderTypeIndex') || 0;
    const reminderTime = wx.getStorageSync('reminderTime') || '20:00';
    const reminderWeekdayIndex = wx.getStorageSync('reminderWeekdayIndex') || 0;
    const reminderMonthDayIndex = wx.getStorageSync('reminderMonthDayIndex') || 0;
    const reminderIntervalIndex = wx.getStorageSync('reminderIntervalIndex') || 2;
    
    this.setData({
      reminderEnabled,
      reminderTypeIndex,
      reminderTime,
      reminderWeekdayIndex,
      reminderMonthDayIndex,
      reminderIntervalIndex
    });
    
    // 计算下次提醒日期
    if (reminderEnabled) {
      this.calculateNextReminderDate();
    }
  },
  
  // 加载统计数据
  loadStatistics: function() {
    const app = getApp();
    const washRecords = app.getWashRecords();
    
    // 计算总洗发次数
    const totalWashCount = washRecords.length;
    
    // 计算平均间隔天数
    let averageInterval = 0;
    if (washRecords.length > 1) {
      // 按日期排序
      const sortedRecords = [...washRecords].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      let totalDays = 0;
      for (let i = 1; i < sortedRecords.length; i++) {
        const prevDate = new Date(sortedRecords[i-1].date);
        const currDate = new Date(sortedRecords[i].date);
        const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
      }
      
      averageInterval = Math.round(totalDays / (sortedRecords.length - 1));
    }
    
    // 计算当前连续天数
    let currentStreak = 0;
    if (washRecords.length > 0) {
      // 获取最近的记录日期
      const sortedRecords = [...washRecords].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const latestDate = new Date(sortedRecords[0].date);
      latestDate.setHours(0, 0, 0, 0);
      
      // 检查最近的记录是否是今天或昨天
      const diffDays = Math.round((today - latestDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        // 从最近的记录开始，向前检查连续天数
        currentStreak = 1;
        for (let i = 1; i < sortedRecords.length; i++) {
          const prevDate = new Date(sortedRecords[i].date);
          prevDate.setHours(0, 0, 0, 0);
          
          const currDate = new Date(sortedRecords[i-1].date);
          currDate.setHours(0, 0, 0, 0);
          
          const diff = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
          
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
    
    // 生成近期洗发频率图表数据
    const chartData = this.generateChartData(washRecords);
    
    // 更新徽章解锁状态
    const updatedBadges = this.updateBadges(washRecords);
    
    // 更新贴纸收集状态
    const updatedStickers = this.updateStickers(washRecords);
    
    // 计算本月洗头次数
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // 使用app.js中的getMonthWashCount函数获取本月洗头次数
    const monthWashCount = app.getMonthWashCount(currentYear, currentMonth);
    
    // 使用app.js中的getWeekWashCount函数获取本周洗头次数
    const weekWashCount = app.getWeekWashCount();
    
    // 更新数据
    this.setData({
      totalWashCount: totalWashCount,
      monthWashCount: monthWashCount,
      weekWashCount: weekWashCount,
      averageInterval: averageInterval || 0,
      currentStreak: currentStreak,
      chartData: chartData,
      badges: updatedBadges,
      stickers: updatedStickers
    });
    
    // 更新洗发水剩余量
    const shampooRemaining = wx.getStorageSync('shampooRemaining') || 7;
    this.setData({
      shampooRemaining: shampooRemaining
    });
  },
  
  // 计算下次提醒日期
  calculateNextReminderDate: function() {
    const app = getApp();
    const washRecords = app.getWashRecords();
    const now = new Date();
    let nextDate = new Date();
    
    // 根据提醒类型计算下次提醒日期
    switch (this.data.reminderTypeIndex) {
      case 0: // 每天提醒
        // 设置为今天的提醒时间
        const [hours, minutes] = this.data.reminderTime.split(':').map(Number);
        nextDate.setHours(hours, minutes, 0, 0);
        
        // 如果今天的提醒时间已过，则设置为明天
        if (nextDate < now) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
        
      case 1: // 每周提醒
        // 获取本周对应星期几的日期
        const currentDay = now.getDay(); // 0-6，对应周日到周六
        const targetDay = this.data.reminderWeekdayIndex; // 0-6，对应周日到周六
        let daysToAdd = targetDay - currentDay;
        
        // 如果目标日期已过，则设置为下周
        if (daysToAdd < 0) {
          daysToAdd += 7;
        } else if (daysToAdd === 0) {
          // 如果是今天，检查时间是否已过
          const [hours, minutes] = this.data.reminderTime.split(':').map(Number);
          const todayTarget = new Date(now);
          todayTarget.setHours(hours, minutes, 0, 0);
          
          if (todayTarget < now) {
            daysToAdd = 7; // 设置为下周
          }
        }
        
        nextDate.setDate(now.getDate() + daysToAdd);
        const [weekHours, weekMinutes] = this.data.reminderTime.split(':').map(Number);
        nextDate.setHours(weekHours, weekMinutes, 0, 0);
        break;
        
      case 2: // 每月提醒
        // 获取目标日期（1-31）
        const targetDate = this.data.monthDays[this.data.reminderMonthDayIndex];
        const currentDate = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // 设置为本月的目标日期
        nextDate = new Date(currentYear, currentMonth, targetDate);
        const [monthHours, monthMinutes] = this.data.reminderTime.split(':').map(Number);
        nextDate.setHours(monthHours, monthMinutes, 0, 0);
        
        // 如果本月的目标日期已过，则设置为下个月
        if (nextDate < now) {
          nextDate = new Date(currentYear, currentMonth + 1, targetDate);
          nextDate.setHours(monthHours, monthMinutes, 0, 0);
        }
        break;
        
      case 3: // 间隔天数提醒
        // 获取最后一次洗头记录
        if (washRecords.length > 0) {
          // 按日期排序，获取最近的记录
          const sortedRecords = [...washRecords].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          );
          
          const lastWashDate = new Date(sortedRecords[0].date);
          const intervalDays = this.data.intervalDays[this.data.reminderIntervalIndex];
          
          // 计算下次提醒日期：最后洗头日期 + 间隔天数
          nextDate = new Date(lastWashDate);
          nextDate.setDate(lastWashDate.getDate() + intervalDays);
          
          // 设置提醒时间
          const [intervalHours, intervalMinutes] = this.data.reminderTime.split(':').map(Number);
          nextDate.setHours(intervalHours, intervalMinutes, 0, 0);
        }
        break;
    }
    
    // 格式化日期显示
    const formattedDate = `${nextDate.getFullYear()}/${nextDate.getMonth() + 1}/${nextDate.getDate()} ${nextDate.getHours()}:${nextDate.getMinutes().toString().padStart(2, '0')}`;
    
    this.setData({
      nextReminderDate: formattedDate
    });
    
    // 保存到本地存储
    wx.setStorageSync('nextReminderDate', formattedDate);
    
    return nextDate;
  },
  
  // 更新徽章解锁状态
  updateBadges: function(records) {
    const badges = [...this.data.badges];
    
    // 洗发新手：记录第一次洗发
    if (records.length > 0) {
      badges[0].unlocked = true;
    }
    
    // 泡泡达人：连续7天每天洗发
    if (this.data.currentStreak >= 7) {
      badges[1].unlocked = true;
    }
    
    // 香香公主：累计洗发30次
    if (records.length >= 30) {
      badges[2].unlocked = true;
    }
    
    // 护发专家：使用3种不同的洗发产品
    const uniqueProducts = new Set();
    records.forEach(record => {
      if (record.product) {
        uniqueProducts.add(record.product);
      }
    });
    if (uniqueProducts.size >= 3) {
      badges[3].unlocked = true;
    }
    
    // 时间管理者：坚持记录洗发1个月
    if (records.length > 0) {
      const sortedRecords = [...records].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      const firstDate = new Date(sortedRecords[0].date);
      const lastDate = new Date(sortedRecords[sortedRecords.length - 1].date);
      
      const monthDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                        lastDate.getMonth() - firstDate.getMonth();
      
      if (monthDiff >= 1) {
        badges[4].unlocked = true;
      }
    }
    
    // 发丝守护者：连续两周保持规律洗发
    // 这里简化为：两周内至少洗发7次
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const recentRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= twoWeeksAgo;
    });
    
    if (recentRecords.length >= 7) {
      badges[5].unlocked = true;
    }
    
    return badges;
  },
  
  // 更新贴纸收集状态
  updateStickers: function(records) {
    const stickers = [...this.data.stickers];
    
    // 根据不同的成就解锁贴纸
    // 示例：每洗发5次解锁一个贴纸
    const unlockedCount = Math.min(Math.floor(records.length / 5) + 2, stickers.length);
    
    for (let i = 0; i < stickers.length; i++) {
      stickers[i].collected = i < unlockedCount;
    }
    
    return stickers;
  },
  
  // 生成图表数据
  generateChartData: function(records) {
    // 如果没有记录，返回空数组
    if (!records || records.length === 0) {
      return [];
    }
    
    // 按日期排序
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // 获取最近30天的数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // 筛选最近30天的记录
    const recentRecords = sortedRecords.filter(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate >= thirtyDaysAgo;
    });
    
    // 生成图表数据
    const chartData = [];
    
    // 创建日期到记录的映射
    const dateMap = {};
    recentRecords.forEach(record => {
      const dateStr = record.date.split(' ')[0]; // 只取日期部分
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = [];
      }
      dateMap[dateStr].push(record);
    });
    
    // 生成最近30天的数据点
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(thirtyDaysAgo.getDate() + i);
      
      const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
      const count = dateMap[dateStr] ? dateMap[dateStr].length : 0;
      
      chartData.push({
        date: dateStr,
        count: count
      });
    }
    
    return chartData;
  },
  
  // 显示徽章详情
  showBadgeDetail: function(e) {
    const badge = e.currentTarget.dataset.badge;
    
    wx.showModal({
      title: badge.name,
      content: badge.description + (badge.unlocked ? '\n\n✨ 已解锁 ✨' : '\n\n🔒 未解锁'),
      showCancel: false,
      confirmText: '知道了'
    });
  },
  
  // 更新洗发水剩余量
  updateShampooRemaining: function(value) {
    if (value >= 0 && value <= 10) {
      this.setData({
        shampooRemaining: value
      });
      
      // 保存到本地存储
      wx.setStorageSync('shampooRemaining', value);
    }
  },
  
  // 切换提醒开关
  toggleReminder: function(e) {
    const enabled = e.detail.value;
    this.setData({
      reminderEnabled: enabled
    });
    
    // 保存到本地存储
    wx.setStorageSync('reminderEnabled', enabled);
    
    // 如果开启提醒，计算下次提醒日期
    if (enabled) {
      this.calculateNextReminderDate();
    }
  },
  
  // 更改提醒类型
  changeReminderType: function(e) {
    const typeIndex = parseInt(e.detail.value);
    this.setData({
      reminderTypeIndex: typeIndex
    });
    
    // 保存到本地存储
    wx.setStorageSync('reminderTypeIndex', typeIndex);
    
    // 重新计算下次提醒日期
    if (this.data.reminderEnabled) {
      this.calculateNextReminderDate();
    }
  },
  
  // 更改提醒时间
  changeReminderTime: function(e) {
    const time = e.detail.value;
    this.setData({
      reminderTime: time
    });
    
    // 保存到本地存储
    wx.setStorageSync('reminderTime', time);
    
    // 重新计算下次提醒日期
    if (this.data.reminderEnabled) {
      this.calculateNextReminderDate();
    }
  },
  
  // 更改每周提醒日期
  changeReminderWeekday: function(e) {
    const weekdayIndex = parseInt(e.detail.value);
    this.setData({
      reminderWeekdayIndex: weekdayIndex
    });
    
    // 保存到本地存储
    wx.setStorageSync('reminderWeekdayIndex', weekdayIndex);
    
    // 重新计算下次提醒日期
    if (this.data.reminderEnabled) {
      this.calculateNextReminderDate();
    }
  },
  
  // 更改每月提醒日期
  changeReminderMonthDay: function(e) {
    const monthDayIndex = parseInt(e.detail.value);
    this.setData({
      reminderMonthDayIndex: monthDayIndex
    });
    
    // 保存到本地存储
    wx.setStorageSync('reminderMonthDayIndex', monthDayIndex);
    
    // 重新计算下次提醒日期
    if (this.data.reminderEnabled) {
      this.calculateNextReminderDate();
    }
  },
  
  // 更改间隔天数
  changeReminderInterval: function(e) {
    const intervalIndex = parseInt(e.detail.value);
    this.setData({
      reminderIntervalIndex: intervalIndex
    });
    
    // 保存到本地存储
    wx.setStorageSync('reminderIntervalIndex', intervalIndex);
    
    // 重新计算下次提醒日期
    if (this.data.reminderEnabled) {
      this.calculateNextReminderDate();
    }
  }
});
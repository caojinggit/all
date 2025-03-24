// index.js
Page({
  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    days: [],
    selectedDate: null,
    monthWashCount: 0
  },

  onLoad: function() {
    this.initCalendar();
  },
  
  onShow: function() {
    // 每次页面显示时重新加载数据
    this.initCalendar();
  },
  
  // 初始化日历数据
  initCalendar: function() {
    const app = getApp();
    const days = this.calculateDays(this.data.year, this.data.month);
    const monthWashCount = app.getMonthWashCount(this.data.year, this.data.month);
    
    this.setData({
      days: days,
      monthWashCount: monthWashCount
    });
  },
  
  // 计算当前月份的日期数据
  calculateDays: function(year, month) {
    const app = getApp();
    const washRecords = app.getWashRecords();
    const days = [];
    
    // 获取当月第一天是星期几
    const firstDay = new Date(year, month, 1).getDay();
    
    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // 获取上个月的天数
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // 当前日期
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const currentDate = today.getDate();
    
    // 添加上个月的日期
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      const year_str = date.getFullYear();
      const month_str = String(date.getMonth() + 1).padStart(2, '0');
      const day_str = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year_str}-${month_str}-${day_str}`;
      
      days.push({
        day: day,
        date: dateStr,
        currentMonth: false,
        isToday: false,
        hasRecord: this.hasWashRecord(washRecords, dateStr)
      });
    }
    
    // 添加当月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const year_str = date.getFullYear();
      const month_str = String(date.getMonth() + 1).padStart(2, '0');
      const day_str = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year_str}-${month_str}-${day_str}`;
      
      days.push({
        day: i,
        date: dateStr,
        currentMonth: true,
        isToday: isCurrentMonth && i === currentDate,
        hasRecord: this.hasWashRecord(washRecords, dateStr)
      });
    }
    
    // 添加下个月的日期（补齐6行日历）
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const year_str = date.getFullYear();
      const month_str = String(date.getMonth() + 1).padStart(2, '0');
      const day_str = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year_str}-${month_str}-${day_str}`;
      
      days.push({
        day: i,
        date: dateStr,
        currentMonth: false,
        isToday: false,
        hasRecord: this.hasWashRecord(washRecords, dateStr)
      });
    }
    
    return days;
  },
  
  // 检查指定日期是否有洗头记录
  hasWashRecord: function(records, dateStr) {
    return records.some(record => {
      // 确保record.date是字符串格式
      let recordDateStr;
      if (typeof record.date === 'string') {
        // 如果日期包含T，说明是ISO格式，需要提取日期部分
        if (record.date.includes('T')) {
          recordDateStr = record.date.split('T')[0];
        } else {
          // 已经是YYYY-MM-DD格式
          recordDateStr = record.date;
        }
      } else if (record.date instanceof Date) {
        const year = record.date.getFullYear();
        const month = String(record.date.getMonth() + 1).padStart(2, '0');
        const day = String(record.date.getDate()).padStart(2, '0');
        recordDateStr = `${year}-${month}-${day}`;
      } else {
        console.error('Invalid date format:', record.date);
        return false;
      }
      return recordDateStr === dateStr;
    });
  }
  ,
  
  // 切换到上个月
  prevMonth: function() {
    let year = this.data.year;
    let month = this.data.month - 1;
    
    if (month < 0) {
      year--;
      month = 11;
    }
    
    this.setData({
      year: year,
      month: month
    }, () => {
      this.initCalendar();
    });
    
    // 添加切换动画效果
    wx.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    }).opacity(0.5).step().opacity(1).step();
  },
  
  // 切换到下个月
  nextMonth: function() {
    let year = this.data.year;
    let month = this.data.month + 1;
    
    if (month > 11) {
      year++;
      month = 0;
    }
    
    this.setData({
      year: year,
      month: month
    }, () => {
      this.initCalendar();
    });
    
    // 添加切换动画效果
    wx.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    }).opacity(0.5).step().opacity(1).step();
  },
  
  // 选择日期
  selectDate: function(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({
      selectedDate: date
    });
    
    // 直接跳转到记录页面
    this.goToRecord(date);
  },
  
  // 查看日期详情
  viewDateDetail: function(date) {
    const app = getApp();
    const records = app.getWashRecords().filter(record => 
      record.date.split('T')[0] === date
    );
    
    if (records.length > 0) {
      // 有记录，显示详情
      let detailInfo = '';
      records.forEach(record => {
        detailInfo += `时间：${record.time}\n`;
        detailInfo += `头皮状态：${record.scalpCondition}\n`;
        if (record.product) {
          detailInfo += `使用产品：${record.product}\n`;
        }
        if (record.notes) {
          detailInfo += `备注：${record.notes}\n`;
        }
        if (record.shampooUsage) {
          detailInfo += `洗发水用量：${record.shampooUsage}ml\n`;
        }
        detailInfo += '-------------------\n';
      });
      
      wx.showModal({
        title: '洗头记录详情',
        content: detailInfo,
        showCancel: false,
        confirmText: '知道了'
      });
    } else {
      // 无记录
      wx.showToast({
        title: '该日期没有洗头记录',
        icon: 'none'
      });
    }
  },
  
  // 跳转到记录页面
  goToRecord: function(date) {
    const selectedDate = date || new Date().toISOString().split('T')[0];
    wx.navigateTo({
      url: '/pages/record/record?date=' + selectedDate
    });
  },
  
  // 一键记录功能
  quickRecord: function() {
    // 获取当前日期和时间
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${hours}:${minutes}`;
    
    // 构建记录数据
    const record = {
      date: dateStr,
      time: timeStr,
      scalpCondition: '', // 非必填
      product: '',
      notes: '',
      shampooUsage: 5, // 默认洗发水用量5ml
      timestamp: now.getTime()
    };
    
    // 保存记录
    const app = getApp();
    const success = app.addWashRecord(record);
    
    if (success) {
      // 更新洗发水剩余量
      const shampooRemaining = wx.getStorageSync('shampooRemaining') || 10;
      const newRemaining = Math.max(0, shampooRemaining - (record.shampooUsage / 20));
      wx.setStorageSync('shampooRemaining', newRemaining);
      
      // 显示成功提示
      wx.showToast({
        title: '记录成功',
        icon: 'success',
        duration: 2000
      });
      
      // 刷新日历
      this.initCalendar();
    } else {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  }
});
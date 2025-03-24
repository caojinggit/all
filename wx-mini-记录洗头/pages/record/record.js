// record.js
Page({
  data: {
    date: '',
    time: '',
    clockHandRotation: 0,
    scalpCondition: '',
    product: '',
    notes: '',
    shampooUsage: 5, // 默认洗发水用量5ml
    showPetals: false // 控制花瓣动画显示
  },

  onLoad: function(options) {
    // 如果有传入日期参数，则使用传入的日期
    if (options && options.date && options.date !== '[object Object]') {
      // 确保日期是字符串格式
      let dateStr = options.date;
      if (typeof options.date === 'object' && options.date instanceof Date) {
        const year = options.date.getFullYear();
        const month = String(options.date.getMonth() + 1).padStart(2, '0');
        const day = String(options.date.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
      this.setData({
        date: dateStr
      });
      
      // 检查该日期是否有记录，如果有则反显
      const app = getApp();
      const records = app.getWashRecords();
      const existingRecord = records.find(record => {
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
      
      if (existingRecord) {
        // 反显记录数据
        this.setData({
          time: existingRecord.time || '',
          scalpCondition: existingRecord.scalpCondition || '',
          product: existingRecord.product || '',
          notes: existingRecord.notes || '',
          shampooUsage: existingRecord.shampooUsage || 5
        });
        
        // 更新时钟指针角度
        if (existingRecord.time) {
          const [hours, minutes] = existingRecord.time.split(':').map(Number);
          this.updateClockHand(hours, minutes);
          return; // 已经设置了时间，不需要再设置当前时间
        }
      }
    } else {
      // 否则使用当前日期
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      this.setData({
        date: `${year}-${month}-${day}`
      });
    }
    
    // 设置当前时间
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    this.setData({
      time: `${hours}:${minutes}`
    });
    
    // 设置时钟指针角度
    this.updateClockHand(hours, minutes);
  },
  
  // 日期选择器变化事件
  bindDateChange: function(e) {
    this.setData({
      date: e.detail.value
    });
  },
  
  // 时间选择器变化事件
  bindTimeChange: function(e) {
    const time = e.detail.value;
    this.setData({
      time: time
    });
    
    // 更新时钟指针角度
    const [hours, minutes] = time.split(':').map(Number);
    this.updateClockHand(hours, minutes);
  },
  
  // 更新时钟指针角度
  updateClockHand: function(hours, minutes) {
    // 计算时钟指针角度：每小时30度，每分钟0.5度
    const hourAngle = (hours % 12) * 30;
    const minuteAngle = minutes * 0.5;
    const rotation = hourAngle + minuteAngle;
    
    this.setData({
      clockHandRotation: rotation
    });
  },
  
  // 选择头皮状态
  selectScalpCondition: function(e) {
    const condition = e.currentTarget.dataset.condition;
    this.setData({
      scalpCondition: condition
    });
    
    // 添加选择动画效果
    wx.createAnimation({
      duration: 200,
      timingFunction: 'ease',
    }).scale(1.1).step().scale(1).step();
  },
  
  // 输入洗发产品
  inputProduct: function(e) {
    this.setData({
      product: e.detail.value
    });
  },
  
  // 输入备注
  inputNotes: function(e) {
    this.setData({
      notes: e.detail.value
    });
  },
  
  // 洗发水用量变化
  shampooUsageChange: function(e) {
    this.setData({
      shampooUsage: e.detail.value
    });
  },
  
  // 提交记录
  submitRecord: function() {
    // 验证必填项
    if (!this.data.date) {
      wx.showToast({
        title: '请选择日期',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.time) {
      wx.showToast({
        title: '请选择时间',
        icon: 'none'
      });
      return;
    }
    
    // 头皮状态不再是必填项
    // if (!this.data.scalpCondition) {
    //   wx.showToast({
    //     title: '请选择头皮状态',
    //     icon: 'none'
    //   });
    //   return;
    // }
    
    // 构建记录数据
    // 确保日期是字符串格式
    let dateStr = this.data.date;
    if (dateStr === '[object Object]') {
      // 如果日期是无效的[object Object]字符串，使用当前日期
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else if (typeof dateStr === 'object' && dateStr instanceof Date) {
      const year = dateStr.getFullYear();
      const month = String(dateStr.getMonth() + 1).padStart(2, '0');
      const day = String(dateStr.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }
    
    const record = {
      date: dateStr,
      time: this.data.time,
      scalpCondition: this.data.scalpCondition,
      product: this.data.product,
      notes: this.data.notes,
      shampooUsage: this.data.shampooUsage,
      timestamp: new Date().getTime()
    };
    
    // 保存记录
    const app = getApp();
    const success = app.addWashRecord(record);
    
    if (success) {
      // 显示花瓣动画
      this.setData({
        showPetals: true
      });
      
      // 更新洗发水剩余量
      const shampooRemaining = wx.getStorageSync('shampooRemaining') || 10;
      const newRemaining = Math.max(0, shampooRemaining - (this.data.shampooUsage / 20));
      wx.setStorageSync('shampooRemaining', newRemaining);
      
      // 显示成功提示
      wx.showToast({
        title: '记录成功',
        icon: 'success',
        duration: 2000
      });
      
      // 2秒后返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    } else {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },
  
  // 页面卸载
  onUnload: function() {
    // 添加水波纹转场效果
    const pageTransition = wx.createAnimation({
      duration: 800,
      timingFunction: 'ease-out',
    });
    
    pageTransition.opacity(1).step().opacity(0).step();
  }
});
Page({
  data: {
    count: 0,
    meritTexts: [],
    stickAnimation: {}
  },
  onTapFish: function() {
    // 增加功德计数
    this.setData({
      count: this.data.count + 1
    });
    
    // 播放音效
    this.playSound();
    
    // 创建功德文字动画
    this.showMeritText();
    
    // 让木棒动起来
    this.animateStick();
  },
  
  showMeritText: function() {
    // 生成随机位置偏移
    const xOffset = Math.floor(Math.random() * 40) - 20;
    
    // 创建新的功德文字
    const newMeritText = {
      id: Date.now(),
      x: xOffset,
      text: '+1'
    };
    
    // 添加到数组中
    const meritTexts = this.data.meritTexts.concat(newMeritText);
    
    this.setData({ meritTexts });
    
    // 1秒后移除这个功德文字
    setTimeout(() => {
      const updatedMeritTexts = this.data.meritTexts.filter(item => item.id !== newMeritText.id);
      this.setData({ meritTexts: updatedMeritTexts });
    }, 1000);
  },
  playSound: function() {
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = '/sounds/dong.mp3';
    innerAudioContext.play();
  },
  
  animateStick: function() {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    });
    
    // 动画效果
    animation.rotate(15).step().rotate(0).step();
    
    this.setData({
      stickAnimation: animation.export()
    });
  }
})
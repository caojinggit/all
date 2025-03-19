// index.js
const api = require('../../utils/api.js');

Page({
  data: {
    response: '',
    inputValue: '',
    animating: false,
    isLoading: false, // 加载状态
    chatHistory: [], // 聊天记录
    showHistory: false, // 是否显示聊天记录
    apiConnected: false, // API连接状态
    isMuted: false, // 是否静音
    audioCtx: null,
    audioUrl: ''
  },

  onLoad: function() {
    // 页面加载时清空对话历史，开始新对话
    api.resetConversation();
  },
  // 合成语音并播放
  

  getAccessToken : async function ()  {
    const { baiduApiKey, baiduSecretKey } = getApp().globalData
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=MlQxWZCJrqOL9dayuqM3D219&client_secret=VgDJFh0pwJsUcsRhQ0RQ2yY4VrmUn0la`
    
    try {
      wx.request({ url,method:'POST',
        
        success:(res)=>{
        if (res?.data.access_token) {
          getApp().globalData.accessToken = res?.data.access_token
          console.log('666',res)
          const apiUrl = 'https://tsn.baidu.com/text2audio'
    
    const params = {
      tex: encodeURIComponent(this.data.response),
      tok: res?.data.access_token,
      cuid: 'mini-program',
      lan: 'zh', // 中文
      ctp: 1,    // 客户端类型
      spd: 6,    // 语速 0-15
      pit: 5,    // 音调 0-15
      vol: 5,     // 音量 0-15
      per: 4206,     // 发音人 0-14
      aue: 3, // 3表示MP3格式
    }

    const reqTask = wx.request({
      url: apiUrl,
      data: params,
      responseType: 'arraybuffer', // 关键：指定响应类型为ArrayBuffer
      header: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*'
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            this.handleAudioData(res.data); // 处理返回的音频数据
          }
        },
        fail: (err) => {
          console.error('TTS请求失败', err);
        }
    })
        }
      } })
      
      
    } catch (error) {
      console.error('Token获取失败:', error)
    }
  },
  handleAudioData(audioData) {
    console.log(audioData instanceof ArrayBuffer)
    // 将二进制数据转为Base64（假设接口返回Base64编码）
    const filePath = `${wx.env.USER_DATA_PATH}/audio_${new Date().getTime()}.mp3`;
  
    // 写入临时文件
    wx.getFileSystemManager().writeFile({
      filePath,
      data: audioData,
      encoding: 'binary',
      success: () => {
        setTimeout(() => {
          this.playAudio(filePath);
        }, 1000);
      },
      fail: (err) => {
        console.error('文件写入失败', err);
      }
    });
  },
  playAudio(url) {
    console.log(url,111)
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.obeyMuteSwitch = false; // 兼容iOS静音模式
    // 显式设置最大音量（0~1）
    innerAudioContext.volume = 1;
    innerAudioContext.src = url;
     // 监听播放结束事件
  innerAudioContext.onEnded(() => {
    console.log('音频播放结束，删除临时文件');
    this.deleteTempFile(url); // 播放完成后删除文件
  });

  // 错误处理
  innerAudioContext.onError((err) => {
    console.error('播放失败，尝试删除文件', err);
    this.deleteTempFile(url);
  });

  innerAudioContext.play();
    // 监听音频加载完成事件
  innerAudioContext.onCanplay(() => {
    console.log('音频已加载，开始播放');
    innerAudioContext.play(); // 在此处触发播放
  });

  
    
  },
  // 删除临时文件
deleteTempFile (filePath) {
  const fs = wx.getFileSystemManager();
  fs.unlink({
    filePath: filePath,
    success: () => {
      console.log('文件删除成功:', filePath);
    },
    fail: (err) => {
      console.error('文件删除失败:', err.errMsg);
    }
  });
},
  toggleMute: function() {
    this.setData({
      isMuted: !this.data.isMuted
    });
  },
  onInput: function(e) {
    // 只更新输入框的值，不立即生成回答
    this.setData({
      inputValue: e.detail.value
    });
  },
  generateResponse: function(input) {
    // 使用API获取回答
    return new Promise((resolve, reject) => {
      if (input.trim() === '') {
        resolve('');
        return;
      }
      
      this.setData({ isLoading: true });
      
      api.generateAIResponse(input)
        .then(response => {
          // 更新本地聊天记录
          const newHistory = this.data.chatHistory.concat([
            { type: 'user', content: input },
            { type: 'assistant', content: response }
          ]);
          
          this.setData({
            chatHistory: newHistory
          });
          
          resolve(response);
        })
        .catch(error => {
          console.error('API错误:', error);
          // 如果API调用失败，使用本地逻辑生成回答
          const localResponse = api.generateLocalResponse(input);
          
          // 依然更新本地聊天记录，但使用本地生成的回复
          const newHistory = this.data.chatHistory.concat([
            { type: 'user', content: input },
            { type: 'assistant', content: localResponse }
          ]);
          
          this.setData({
            chatHistory: newHistory
          });
          
          resolve(localResponse);
        })
        .finally(() => {
          this.setData({ isLoading: false });
        });
    });
  },
  onSend: function() {
    // 获取输入框的内容
    const userInput = this.data.inputValue;
    if (userInput.trim() === '') return; // 如果输入为空，不做处理
    
    // 清空输入框
    this.setData({
      inputValue: '',
      animating: true
    });
    
    // 生成回答并显示
    this.generateResponse(userInput)
      .then(response => {
        this.setData({
          response: response
        });
        this.getAccessToken()
      });
    
    // 动画结束后重置状态
    setTimeout(() => {
      this.setData({
        animating: false
      });
    }, 800);
    
    // 6秒后清空当前对话气泡，但不清空历史记录
    setTimeout(() => {
      this.setData({
        response: ''
      });
    }, 6000);
  },
  
  animateBoyFriend: function() {
    this.setData({
      animating: true
    });
    
    // 动画结束后重置状态
    setTimeout(() => {
      this.setData({
        animating: false
      });
    }, 800);
  },
  
  // 切换显示聊天历史
  toggleHistory: function() {
    this.setData({
      showHistory: !this.data.showHistory
    });
  },
  
  // 清空聊天历史
  clearHistory: function() {
    api.resetConversation();
    this.setData({
      chatHistory: [],
      response: ''
    });
  },
  
  // 测试API连接状态
  testAPIConnection: function() {
    this.setData({ isLoading: true });
    
    // 发送简单请求测试连接
    api.generateAIResponse("测试连接")
      .then(response => {
        console.log("API连接成功:", response);
        this.setData({ 
          apiConnected: true,
          response: "连接成功！" 
        });
        
        // 3秒后清除测试消息
        setTimeout(() => {
          if (this.data.response === "连接成功！") {
            this.setData({ response: "" });
          }
        }, 3000);
        
        // 不记录测试消息到历史
        this.setData({ 
          chatHistory: this.data.chatHistory.slice(0, this.data.chatHistory.length - 2) 
        });
        api.resetConversation();
      })
      .catch(error => {
        console.error("API连接失败:", error);
        this.setData({ 
          apiConnected: false,
          response: "AI连接失败，将使用本地回复。" 
        });
        
      })
      .finally(() => {
        this.setData({ isLoading: false });
      });
  }
});

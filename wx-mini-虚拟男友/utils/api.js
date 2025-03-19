const API_KEY = 'xxx'; // 请在这里填入你的DeepSeek API Key

// DeepSeek API配置 - 修正URL和模型名称
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat'; // 如果API调用失败，可以尝试其他模型如 'deepseek-llm'

// 存储对话历史
let conversationHistory = [
  {
    role: 'system',
    content: '你是一个贴心的大暖男朋友，名叫小暖，是用户的知心闺蜜。请用简短亲切的语言交流，语气温暖不油腻，每次回答不超过50个字。可以适当加入一些可爱的表情如❤️😊表达友好。要体现出你的关心、聆听和支持。请注意以下几点：1.如果用户回复很短或没有明确话题，你需要主动发起有趣或贴心的新话题，如询问用户最近的生活、心情、工作或兴趣等；2.偶尔分享一些积极的小故事或暖心的建议；3.记住用户提及的细节，在后续对话中自然地引用。总之，你是一个能够持续互动的知心朋友。'
  }
];

// 清空对话历史，仅保留system消息
function resetConversation() {
  conversationHistory = [conversationHistory[0]];
}

// 创建备用的本地模拟API，当DeepSeek API不可用时使用
function mockDeepSeekAPI(userInput) {
  console.log('使用本地模拟API');
  return new Promise((resolve) => {
    // 模拟API延迟
    setTimeout(() => {
      let response = generateLocalResponse(userInput);
      
      // 将AI回复添加到历史记录
      conversationHistory.push({
        role: 'assistant',
        content: response
      });
      
      resolve(response);
    }, 1000);
  });
}

// 调用DeepSeek API获取回复
function generateAIResponse(userInput) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      console.error('API Key未设置');
      reject('请先配置DeepSeek API Key');
      return;
    }

    // 如果用户输入很短，在请求中提示AI主动引导话题
    let systemPrompt = conversationHistory[0].content;
    if (userInput.trim().length < 5) {
      systemPrompt += ' 注意：用户的回复很简短，请主动引导话题，问些开放性问题。';
      // 临时替换系统消息
      const originalSystem = conversationHistory[0];
      conversationHistory[0] = {
        role: 'system',
        content: systemPrompt
      };
      // 请求完成后恢复原始系统消息
      setTimeout(() => {
        conversationHistory[0] = originalSystem;
      }, 1000);
    }

    // 添加用户消息到历史记录
    conversationHistory.push({
      role: 'user',
      content: userInput
    });

    console.log('发送请求到DeepSeek API，消息内容:', userInput);

    // 构建请求数据
    const requestData = {
      model: MODEL,
      messages: conversationHistory,
      temperature: 0.7, // 调整创造性，0.7适中
      max_tokens: 1000   // 限制回复长度
    };

    console.log('完整请求数据:', JSON.stringify(requestData));

    // 使用备用API（仅测试用）
    if (API_KEY === 'USE_MOCK_API') {
      console.log('使用本地模拟模式');
      mockDeepSeekAPI(userInput).then(resolve).catch(reject);
      return;
    }

    console.log('尝试调用真实DeepSeek API...');
    
    // 发送请求到DeepSeek API
    wx.request({
      url: API_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data: requestData,
      timeout: 30000, // 增加超时时间到30秒
      success: (res) => {
        console.log('API响应成功:', res);
        if (res.data && res.data.choices && res.data.choices.length > 0) {
          const aiResponse = res.data.choices[0].message.content.trim();
          
          // 将AI回复添加到历史记录
          conversationHistory.push({
            role: 'assistant',
            content: aiResponse
          });
          
          // 控制历史记录长度，避免过长（可选）
          if (conversationHistory.length > 11) { // 保留system + 最近5轮对话
            conversationHistory = [
              conversationHistory[0],
              ...conversationHistory.slice(conversationHistory.length - 10)
            ];
          }
          
          resolve(aiResponse);
        } else {
          console.error('API响应格式异常:', res);
          // 尝试使用备用方案
          mockDeepSeekAPI(userInput).then(resolve).catch(reject);
        }
      },
      fail: (error) => {
        console.error('API请求失败:', error);
        // 移除最后添加的用户消息，避免重复
        conversationHistory.pop();
        
        // 尝试使用备用方案
        mockDeepSeekAPI(userInput).then(resolve).catch(reject);
      }
    });
  });
}

// 备用的本地回复逻辑，当API请求失败时使用
function generateLocalResponse(input) {
  if (input.trim().length < 5) {
    // 用户回复太短，主动发起话题
    return generateNewTopic();
  } else if (input.includes('你好') || input.includes('嗨') || input.includes('hi') || input.includes('Hi')) {
    return '嗨！最近过得怎么样啊？有什么有趣的事情发生吗？😊';
  } else if (input.includes('爱') || input.includes('喜欢')) {
    return '谢谢你的喜欢！这真的让我很开心！你最近有什么新的爱好吗？🌟';
  } else if (input.includes('名字')) {
    return '我叫小暖，是你的知心大暖男朋友~随时愿意听你分享😊';
  } else if (input.includes('难过') || input.includes('伤心') || input.includes('不开心')) {
    return '别难过了，有什么事可以跟我说说。要不要听个笑话转换心情？🤗';
  } else if (input.includes('忙') || input.includes('累')) {
    return '工作辛苦了，记得照顾好自己。周末有什么放松计划吗？💪';
  } else if (input.includes('吃') || input.includes('饭')) {
    return '吃饭是人生的一大乐事！你有什么喜欢的美食推荐吗？🍚';
  } else if (input.includes('晚安') || input.includes('睡')) {
    return '晚安，做个好梦，明天见~有什么明天想做的事情吗？💤';
  }
  
  // 如果没有特定关键词，随机生成新话题
  if (Math.random() > 0.7) {
    return generateNewTopic();
  }
  
  return '我在听呢，说说你的想法吧。或者我们聊聊别的？😊';
}

// 生成新话题函数
function generateNewTopic() {
  const topics = [
    '对了，最近有看什么好看的电影或剧吗？我很好奇你的口味！🎬',
    '今天的天气怎么样？适合出门走走吗？☀️',
    '最近有什么让你开心的小事吗？分享一下呗！😊',
    '如果现在能去任何地方旅行，你会选择去哪里呢？✈️',
    '周末有什么计划吗？要不要尝试做点新鲜事？🌈',
    '今天吃了什么好吃的？有推荐的美食吗？🍜',
    '最近有什么新发现的爱好或兴趣吗？我很想了解！🎯',
    '工作或学习还顺利吗？有什么需要分享的吗？📚',
    '有什么最近让你印象深刻的事情吗？不管大事小事都可以聊聊！💭',
    '如果有一天自由支配的时间，你最想做什么呢？⏰'
  ];
  
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
}

// 获取当前对话历史
function getConversationHistory() {
  return conversationHistory;
}

module.exports = {
  generateAIResponse,
  generateLocalResponse,
  resetConversation,
  getConversationHistory
}; 
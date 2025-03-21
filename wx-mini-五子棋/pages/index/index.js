// pages/index/index.js
Page({
  data: {
    // 棋盘数据，0表示空，1表示黑棋，2表示白棋
    board: [],
    // 当前玩家，1表示黑棋，2表示白棋
    currentPlayer: 1,
    // 游戏是否结束
    gameOver: false,
    // 赢家，0表示没有赢家，1表示黑棋赢，2表示白棋赢
    winner: 0,
    // 胜利的五个棋子位置
    winPositions: [],
    // 步数统计
    steps: 0,
    // 棋盘尺寸
    boardSize: 15,
    // 棋盘格子大小（rpx）
    gridSize: 40,
    // 棋子大小（rpx）
    pieceSize: 36,
    // 棋盘边距（rpx）
    boardMargin: 20,
    // 动画相关
    animationData: {},
    // 预览位置
    previewPosition: null,
    // 背景动画帧
    bgAnimFrame: 0,
    // 是否显示胜利弹窗
    showVictoryModal: false
  },

  attached: function() {
    const screenWidth = wx.getSystemInfoSync().windowWidth;
    this.setData({
      gridSize: Math.floor(screenWidth * 0.8 / 15)
    });
  },
  onLoad: function() {
    // 初始化游戏
    this.initGame();
    
    // 获取窗口信息以适配不同屏幕
    const windowInfo = wx.getWindowInfo();
    // 计算棋盘实际大小
    const windowWidth = windowInfo.windowWidth;
    // 根据屏幕宽度调整棋盘大小
    // 计算包含边距的网格尺寸
    const gridSize = Math.floor((windowWidth - this.data.boardMargin * 2) / this.data.boardSize);
    this.setData({
      gridSize: gridSize,
      pieceSize: Math.floor(gridSize * 0.9)
    });
    
    // 尝试恢复游戏进度
    this.restoreGameState();
    
    // 初始化背景动画
    this.initBackgroundAnimation();
  },
  
  onShow: function() {
    // 恢复背景动画
    if (this.bgAnimationTimer) {
      clearInterval(this.bgAnimationTimer);
    }
    this.bgAnimationTimer = setInterval(() => {
      this.updateBackgroundAnimation();
    }, 100);
  },
  
  onHide: function() {
    // 暂停背景动画
    if (this.bgAnimationTimer) {
      clearInterval(this.bgAnimationTimer);
    }
  },
  
  onUnload: function() {
    // 保存游戏状态
    this.saveGameState();
    // 清除动画定时器
    if (this.bgAnimationTimer) {
      clearInterval(this.bgAnimationTimer);
    }
  },

  // 初始化游戏
  initGame: function() {
    // 创建空棋盘
    const board = [];
    for (let i = 0; i < this.data.boardSize; i++) {
      board[i] = [];
      for (let j = 0; j < this.data.boardSize; j++) {
        board[i][j] = 0;
      }
    }

    this.setData({
      board: board,
      currentPlayer: 1,
      gameOver: false,
      winner: 0,
      winPositions: [],
      steps: 0,
      showVictoryModal: false
    });
    
    // 保存游戏状态
    this.saveGameState();
  },

  // 初始化背景动画
  initBackgroundAnimation: function() {
    // 设置背景动画定时器
    this.bgAnimationTimer = setInterval(() => {
      this.updateBackgroundAnimation();
    }, 100);
  },
  
  // 更新背景动画
  updateBackgroundAnimation: function() {
    this.setData({
      bgAnimFrame: (this.data.bgAnimFrame + 1) % 60
    });
    // 更新Canvas背景
    this.drawBackground();
  },
  
  // 绘制动态背景
  drawBackground: function() {
    const query = wx.createSelectorQuery();
    query.select('#background-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const width = res[0].width;
        const height = res[0].height;
        
        // 设置Canvas尺寸
        canvas.width = width;
        canvas.height = height;
        
        // 清除画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制深空背景
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制流光网格
        const gridSize = 30;
        const time = this.data.bgAnimFrame / 60;
        
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.lineWidth = 1;
        
        // 水平线
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          for (let x = 0; x < width; x += 5) {
            const offset = Math.sin(x / 50 + time * Math.PI * 2) * 5;
            ctx.lineTo(x, y + offset);
          }
          ctx.stroke();
        }
        
        // 垂直线
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          for (let y = 0; y < height; y += 5) {
            const offset = Math.sin(y / 50 + time * Math.PI * 2) * 5;
            ctx.lineTo(x + offset, y);
          }
          ctx.stroke();
        }
        
        // 绘制粒子
        const particleCount = 50;
        ctx.fillStyle = 'rgba(0, 243, 255, 0.7)';
        
        for (let i = 0; i < particleCount; i++) {
          const x = Math.sin(i * 0.1 + time * 2) * width / 2 + width / 2;
          const y = Math.cos(i * 0.1 + time * 2) * height / 2 + height / 2;
          const size = Math.sin(i * 0.05 + time * 3) * 2 + 2;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
  },

  // 处理棋盘点击事件
  onBoardTap: function(e) {
    // 如果游戏已结束，不处理点击
    if (this.data.gameOver) return;
    
    // 获取点击位置
    const touch = e.changedTouches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // 获取棋盘元素位置信息
    const query = wx.createSelectorQuery();
    query.select('.board').boundingClientRect(rect => {
      if (!rect) return;
      
      // 计算相对于棋盘的坐标
      const boardX = x - rect.left;
      const boardY = y - rect.top;
      
      // 计算最近的交叉点
      const gridSize = this.data.gridSize;
      const pieceOffset = gridSize * 0.5; // 改为基于gridSize的50%
      // 计算包含边距的网格索引
      const effectiveBoardY = boardY - this.data.boardMargin;
      const effectiveBoardX = boardX - this.data.boardMargin;
      const i = Math.round(effectiveBoardY / gridSize);
      const j = Math.round(effectiveBoardX / gridSize);
    
      // 检查是否在棋盘范围内
      if (i < 0 || i >= this.data.boardSize || j < 0 || j >= this.data.boardSize) {
        return;
      }
    
      // 检查该位置是否已有棋子
      if (this.data.board[i][j] !== 0) {
        return;
      }
    
      // 更新棋盘数据
      const board = this.data.board;
      board[i][j] = this.data.currentPlayer;
      
      // 创建落子动画
      this.createPieceAnimation(i, j);
      
      // 更新数据
      this.setData({
        board: board,
        steps: this.data.steps + 1,
        previewPosition: null
      });
    
      // 检查是否获胜
      const result = this.checkWin(i, j, this.data.currentPlayer);
      if (result.win) {
        this.setData({
          gameOver: true,
          winner: this.data.currentPlayer,
          winPositions: result.positions,
          showVictoryModal: true
        });
      } else {
        // 切换玩家
        this.setData({
          currentPlayer: this.data.currentPlayer === 1 ? 2 : 1
        });
      }
      
      // 保存游戏状态
      this.saveGameState();
    }).exec();
  },
  
  // 创建落子动画
  createPieceAnimation: function(i, j) {
    const animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    });
    
    animation.scale(1, 1).step({ duration: 0 });
    animation.scale(1.2, 1.2).step({ duration: 150 });
    animation.scale(1, 1).step({ duration: 150 });
    
    this.setData({
      animationData: animation.export(),
      animationPosition: { i, j }
    });
  },

  // 处理鼠标移动事件（预览落子位置）
  onBoardMove: function(e) {
    if (this.data.gameOver) return;
    
    // 获取移动位置
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    // 获取棋盘元素位置信息
    const query = wx.createSelectorQuery();
    query.select('.board').boundingClientRect(rect => {
      if (!rect) return;
      
      const boardX = x - rect.left;
      const boardY = y - rect.top;
    
      // 计算最近的交叉点
      const gridSize = this.data.gridSize;
      // 计算包含边距的网格索引
      const effectiveBoardY = boardY - this.data.boardMargin;
      const effectiveBoardX = boardX - this.data.boardMargin;
      const i = Math.round(effectiveBoardY / gridSize);
      const j = Math.round(effectiveBoardX / gridSize);
    
      // 检查是否在棋盘范围内且该位置没有棋子
      if (i >= 0 && i < this.data.boardSize && j >= 0 && j < this.data.boardSize && this.data.board[i][j] === 0) {
        this.setData({
          previewPosition: { i, j }
        });
      } else {
        this.setData({
          previewPosition: null
        });
      }
    }).exec();
  },
  
  // 处理鼠标离开棋盘事件
  onBoardLeave: function() {
    this.setData({
      previewPosition: null
    });
  },

  // 检查是否获胜
  checkWin: function(row, col, player) {
    const directions = [
      [0, 1],   // 水平
      [1, 0],   // 垂直
      [1, 1],   // 右下对角线
      [1, -1]   // 左下对角线
    ];
    
    for (let [dx, dy] of directions) {
      let count = 1; // 当前位置已经有一个棋子
      let positions = [{row, col}];
      
      // 正向检查
      for (let i = 1; i <= 4; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        
        if (newRow < 0 || newRow >= this.data.boardSize || newCol < 0 || newCol >= this.data.boardSize) {
          break;
        }
        
        if (this.data.board[newRow][newCol] === player) {
          count++;
          positions.push({row: newRow, col: newCol});
        } else {
          break;
        }
      }
      
      // 反向检查
      for (let i = 1; i <= 4; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        
        if (newRow < 0 || newRow >= this.data.boardSize || newCol < 0 || newCol >= this.data.boardSize) {
          break;
        }
        
        if (this.data.board[newRow][newCol] === player) {
          count++;
          positions.push({row: newRow, col: newCol});
        } else {
          break;
        }
      }
      
      // 如果有五个连续的棋子，则获胜
      if (count >= 5) {
        return { win: true, positions: positions };
      }
    }
    
    return { win: false, positions: [] };
  },
  
  // 判断一个位置是否是胜利的五连子之一
  isWinPosition: function(row, col) {
    if (!this.data.gameOver || this.data.winPositions.length === 0) {
      return false;
    }
    
    for (let pos of this.data.winPositions) {
      if (pos.row === row && pos.col === col) {
        return true;
      }
    }
    
    return false;
  },

  // 重新开始游戏
  restartGame: function() {
    this.initGame();
    this.setData({
      showVictoryModal: false
    });
  },
  
  // 关闭胜利弹窗
  closeVictoryModal: function() {
    this.setData({
      showVictoryModal: false
    });
  },
  
  // 保存游戏状态
  saveGameState: function() {
    try {
      wx.setStorageSync('gameState', {
        board: this.data.board,
        currentPlayer: this.data.currentPlayer,
        gameOver: this.data.gameOver,
        winner: this.data.winner,
        winPositions: this.data.winPositions,
        steps: this.data.steps
      });
    } catch (e) {
      console.error('保存游戏状态失败', e);
    }
  },
  
  // 恢复游戏状态
  restoreGameState: function() {
    try {
      const gameState = wx.getStorageSync('gameState');
      if (gameState) {
        this.setData({
          board: gameState.board,
          currentPlayer: gameState.currentPlayer,
          gameOver: gameState.gameOver,
          winner: gameState.winner,
          winPositions: gameState.winPositions,
          steps: gameState.steps,
          showVictoryModal: gameState.gameOver && gameState.winner > 0
        });
      }
    } catch (e) {
      console.error('恢复游戏状态失败', e);
    }
  }
});
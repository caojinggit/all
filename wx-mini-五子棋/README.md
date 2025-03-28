# 赛博朋克五子棋微信小程序

这是一个具有赛博朋克风格的双人五子棋微信小程序，提供了标准的五子棋游戏体验，并融入了未来科技感的视觉设计。

## 功能特点

### 核心游戏功能
- 15×15标准棋盘
- 黑白棋交替下棋机制
- 智能胜负判定（水平/垂直/对角线五连）
- 实时显示当前执子方
- 胜利时高亮显示五连棋子
- 防止重复落子

### 交互功能
- 点击棋盘智能吸附到最近交叉点
- 自动保存游戏进度
- 重新开始游戏按钮
- 胜负弹窗提示
- 步数统计显示

### 赛博朋克视觉设计
- 深空黑底色+动态流光网格背景
- 霓虹蓝棋盘线条
- 紫色黑棋与青蓝色白棋
- 落子动画与胜利高亮效果
- 全息风格UI组件

## 使用说明

1. 使用微信开发者工具打开项目
2. 点击棋盘交叉点落子
3. 黑棋和白棋轮流下棋
4. 任意一方形成五连子即获胜
5. 点击"重新开始"按钮可重置游戏

## 技术实现

- 使用Canvas实现动态背景效果
- CSS动画实现UI交互反馈
- 本地存储保存游戏进度
- 响应式布局适配不同屏幕

## 项目结构

```
├── app.js                 # 小程序入口文件
├── app.json               # 全局配置
├── app.wxss               # 全局样式
├── pages                  # 页面文件夹
│   └── index              # 主页面
│       ├── index.js       # 游戏逻辑
│       ├── index.wxml     # 页面结构
│       └── index.wxss     # 页面样式
├── project.config.json    # 项目配置
└── sitemap.json           # 索引配置
```
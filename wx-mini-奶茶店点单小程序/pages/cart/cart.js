// 购物车逻辑
import { products } from '../../data.js';

Page({
  data: {
    cartItems: [],
    totalCount: 0,
    totalPrice: 0,
    showCart: true,
    animationData: {}
  },
  
  onLoad() {
    // 从缓存中读取购物车数据
    const cartItems = wx.getStorageSync('cartItems') || [];
    const totalPrice = wx.getStorageSync('totalPrice') || '0.00';
    const totalCount = wx.getStorageSync('totalCount') || 0;
    
    this.setData({
      cartItems,
      totalPrice,
      totalCount
    });
    
    // 创建动画实例
    this.animation = wx.createAnimation({
      duration: 300,
      timingFunction: 'ease',
    });
  },

  // 切换购物车显示
  toggleCart() {
    // 添加动画效果
    if (!this.data.showCart) {
      this.animation.opacity(1).translateY(0).step();
    } else {
      this.animation.opacity(0).translateY(20).step();
    }
    
    this.setData({
      animationData: this.animation.export(),
      showCart: !this.data.showCart
    });
  },

  // 添加商品
  addItem(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.cartItems.find(i => i.id === id) || 
                 products.find(p => p.id === id);
    
    if (item.quantity) {
      item.quantity++;
    } else {
      item.quantity = 1;
      this.data.cartItems.push(item);
    }
    
    this.updateCart();
    
    // 添加触感反馈
    wx.vibrateShort({
      type: 'light'
    });
  },

  // 移除商品
  removeItem(e) {
    const id = e.currentTarget.dataset.id;
    const index = this.data.cartItems.findIndex(i => i.id === id);
    
    if (index !== -1) {
      const item = this.data.cartItems[index];
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        this.data.cartItems.splice(index, 1);
      }
      this.updateCart();
      
      // 添加触感反馈
      wx.vibrateShort({
        type: 'light'
      });
    }
  },

  // 更新购物车状态
  updateCart() {
    const total = this.data.cartItems.reduce((sum, item) => 
      sum + item.price * item.quantity, 0);
    
    this.setData({
      cartItems: this.data.cartItems,
      totalCount: this.data.cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: total.toFixed(2)
    });
    
    // 同步到缓存，方便其他页面使用
    wx.setStorageSync('cartItems', this.data.cartItems);
    wx.setStorageSync('totalPrice', this.data.totalPrice);
    wx.setStorageSync('totalCount', this.data.totalCount);
  },

  // 模拟下单
  placeOrder() {
    if (this.data.cartItems.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    wx.showToast({
      title: '下单成功',
      icon: 'success',
      duration: 2000
    });
    
    this.setData({
      cartItems: [],
      totalCount: 0,
      totalPrice: 0,
      showCart: false
    });
    
    // 清空缓存
    wx.setStorageSync('cartItems', []);
    wx.setStorageSync('totalPrice', '0.00');
    wx.setStorageSync('totalCount', 0);
  }
});
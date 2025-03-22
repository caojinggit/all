// 导入数据模块
import { products, filterByCategory } from '../../data.js';

Page({
  data: {
    activeCategory: '经典奶茶',
    products: [],
    banners: [
      '/images/banner1.svg',
      '/images/banner2.svg',
      '/images/banner3.svg'
    ],
    cartItems: [],
    totalCount: 0,
    totalPrice: 0,
    showCart: false,
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
    
    this.switchCategory({ currentTarget: { dataset: { category: '经典奶茶' }}});
  },

  // 分类切换事件
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      activeCategory: category,
      products: filterByCategory(category)
    });
  },

  // 商品点击事件
  showDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
      title: item.name,
      content: item.desc,
      showCancel: false
    });
  },
  
  // 添加商品到购物车
  addToCart(e) {
    // catchtap已经阻止了事件冒泡，不需要调用stopPropagation
    const id = e.currentTarget.dataset.id;
    const item = this.data.products.find(p => p.id === id);
    
    // 检查购物车中是否已有该商品
    const cartIndex = this.data.cartItems.findIndex(i => i.id === id);
    
    if (cartIndex !== -1) {
      // 已有该商品，数量+1
      const cartItems = this.data.cartItems;
      cartItems[cartIndex].quantity += 1;
      this.setData({ cartItems });
    } else {
      // 没有该商品，添加到购物车
      const cartItem = { ...item, quantity: 1 };
      this.setData({
        cartItems: [...this.data.cartItems, cartItem]
      });
    }
    
    this.updateCart();
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success',
      duration: 1000
    });
  },
  
  // 更新购物车状态
  updateCart() {
    const totalPrice = this.data.cartItems.reduce((sum, item) => 
      sum + item.price * item.quantity, 0);
    
    const totalCount = this.data.cartItems.reduce((sum, item) => 
      sum + item.quantity, 0);
    
    this.setData({
      totalPrice: totalPrice.toFixed(2),
      totalCount
    });
    
    // 同步到缓存，方便其他页面使用
    wx.setStorageSync('cartItems', this.data.cartItems);
    wx.setStorageSync('totalPrice', this.data.totalPrice);
    wx.setStorageSync('totalCount', this.data.totalCount);
  },
  
  // 切换购物车显示
  goToCart() {
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
  
  // 添加商品数量
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

  // 移除商品数量
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
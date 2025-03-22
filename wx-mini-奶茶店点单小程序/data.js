// 商品数据模型
const products = [
  // 冰沙系列
  {
    id: 39,
    name: '芒果冰沙',
    price: 20,
    category: '冰沙系列',
    image: '/images/smoothie.svg',
    desc: '新鲜芒果制作的绵密冰沙',
    isHot: true,
    stock: 25
  },
  // 季节限定
  {
    id: 40,
    name: '草莓芝士',
    price: 28,
    category: '季节限定',
    image: '/images/seasonal.svg',
    desc: '当季新鲜草莓搭配芝士奶盖',
    stock: 20
  },
  // 低卡专区
  {
    id: 41,
    name: '燕麦拿铁低卡版',
    price: 22,
    category: '低卡专区',
    image: '/images/low-calorie.svg',
    desc: '使用低脂燕麦奶制作的拿铁',
    isHot: true,
    stock: 30
  },
  {
    id: 1,
    name: '芝士奶盖四季春',
    price: 18,
    category: '经典奶茶',
    image: '/images/bubble-tea.svg',
    desc: '醇香芝士奶盖搭配清新四季春茶底'
  },
  {
    id: 2,
    name: '珍珠奶茶',
    price: 15,
    category: '经典奶茶',
    image: '/images/bubble-tea.svg',
    desc: '经典台式奶茶配Q弹黑糖珍珠'
  },
  {
    id: 3,
    name: '芒果奶盖',
    price: 16,
    category: '经典奶茶',
    image: '/images/bubble-tea.svg',
    desc: '新鲜芒果制作的绵密奶盖',
    isHot: true,
    stock: 45
  },
  {
    id: 8,
    name: '蜜桃乌龙茶',
    price: 16,
    category: '果茶',
    image: '/images/fruit-tea.svg',
    desc: '新鲜蜜桃果肉搭配炭焙乌龙茶'
  },
  {
    id: 9,
    name: '芒果冰沙',
    price: 20,
    category: '果茶',
    image: '/images/fruit-tea.svg',
    desc: '当季新鲜芒果制作的绵密冰沙'
  },
  {
    id: 16,
    name: '香草拿铁',
    price: 22,
    category: '咖啡',
    image: '/images/coffee.svg',
    desc: '意式浓缩咖啡搭配香草风味牛奶'
  },
  {
    id: 33,
    name: '黑糖珍珠奶茶',
    price: 19,
    category: '经典奶茶',
    image: '/images/bubble-tea.svg',
    desc: '古法熬制黑糖珍珠',
    isHot: true,
    stock: 38
  },
  {
    id: 34,
    name: '抹茶拿铁',
    price: 22,
    category: '经典奶茶',
    image: '/images/bubble-tea.svg',
    desc: '日本宇治抹茶配方',
    isHot: false,
    stock: 27
  },
  {
    id: 35,
    name: '荔枝玫瑰',
    price: 24,
    category: '果茶',
    image: '/images/fruit-tea.svg',
    desc: '荔枝果肉搭配重瓣玫瑰',
    isHot: true,
    stock: 15
  },
  {
    id: 36,
    name: '蓝莓爆柠',
    price: 21,
    category: '果茶',
    image: '/images/fruit-tea.svg',
    desc: '新鲜蓝莓与香水柠檬组合',
    isHot: true,
    stock: 22
  },
  {
    id: 37,
    name: '椰香美式',
    price: 18,
    category: '咖啡',
    image: '/images/coffee.svg',
    desc: '椰子水搭配浓缩咖啡',
    isHot: false,
    stock: 30
  },
  {
    id: 38,
    name: '焦糖玛奇朵',
    price: 25,
    category: '咖啡',
    image: '/images/coffee.svg',
    desc: '经典意式咖啡饮品',
    isHot: true,
    stock: 18
  }
];

// 分类过滤函数
function filterByCategory(category) {
  return products.filter(product => product.category === category);
}

export { products, filterByCategory };
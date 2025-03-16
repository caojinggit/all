Page({
  data: {
    hasImage: false,
    canvasWidth: 0,
    canvasHeight: 0,
    currentColor: "#49c8fa",
    basicColors: [
      "#000000",
      "#49c8fa",
      "#abd6f3",
      "#f9dccc",
      "#1493d5",
      "#2d3247",
      "#154872",
      "#ffffff",
      "#8e0303",
      "#2e1916",
      "#ffca28",
    ],
    canvas: null,
    context: null,
    tolerance: 40,
    whiteTolerance: 30, // 用于判断是否为白色区域的容差值
    showPopup: false,
    popupTop: 0,
    popupLeft: 0,
    fillHistory: [], // 存储填充历史记录
  },

  onLoad: function () {
    this.initCanvas();
  },

  // 初始化画布
  initCanvas: function () {
    const query = wx.createSelectorQuery();
    query
      .select("#mainCanvas")
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node;
          const context = canvas.getContext("2d");

          this.setData({
            canvas: canvas,
            context: context,
          });
        }
      });
  },
  // 初始化光谱渐变色画布
  initSpectrumCanvas: function () {
    const query = wx.createSelectorQuery();
    query
      .select("#spectrumCanvas")
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const spectrumCanvas = res[0].node;
          const spectrumCtx = spectrumCanvas.getContext("2d");

          const gradient = spectrumCtx.createLinearGradient(
            0,
            0,
            spectrumCanvas.width,
            0
          );
          gradient.addColorStop(0, "red");
          gradient.addColorStop(0.16, "orange");
          gradient.addColorStop(0.33, "yellow");
          gradient.addColorStop(0.5, "green");
          gradient.addColorStop(0.66, "cyan");
          gradient.addColorStop(0.83, "blue");
          gradient.addColorStop(1, "purple");

          spectrumCtx.fillStyle = gradient;
          spectrumCtx.fillRect(
            0,
            0,
            spectrumCanvas.width,
            spectrumCanvas.height
          );

          this.setData({
            spectrumCanvas: spectrumCanvas,
            spectrumCtx: spectrumCtx,
          });
        }
      });
  },
  // 选择图片
  chooseImage: function () {
    console.log(1);
    wx.chooseImage({
      count: 1,
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.loadImage(tempFilePath);
      },
    });
  },

  // 加载图片到画布
  loadImage: function (filePath) {
    const { canvas, context } = this.data;
    if (!canvas || !context) return;

    // 获取图片信息
    wx.getImageInfo({
      src: filePath,
      success: (res) => {
        // 获取窗口信息
        const windowInfo = wx.getWindowInfo();
        const maxWidth = windowInfo.windowWidth;
        const maxHeight = windowInfo.windowHeight - 120; // 减去工具栏高度

        let width = res.width;
        let height = res.height;

        // 计算最佳缩放比例以适应屏幕
        const scaleWidth = maxWidth / width;
        const scaleHeight = maxHeight / height;
        const scale = Math.min(scaleWidth, scaleHeight);

        width = width * scale;
        height = height * scale;

        // 设置画布尺寸
        canvas.width = width;
        canvas.height = height;

        this.setData({
          canvasWidth: width,
          canvasHeight: height,
          hasImage: true,
        });

        // 创建图片对象并绘制到画布
        const img = canvas.createImage();
        img.onload = () => {
          context.drawImage(img, 0, 0, width, height);
        };
        img.src = filePath;
      },
    });
  },

  // 处理画布点击
  onCanvasClick: function (e) {
    if (!this.data.hasImage) return;

    const { canvas, context } = this.data;
    if (!canvas || !context) return;

    const query = wx.createSelectorQuery();
    query
      .select("#mainCanvas")
      .boundingClientRect((rect) => {
        // 计算点击位置相对于canvas的坐标
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;

        // 转换为canvas实际尺寸的坐标
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = Math.floor(x * scaleX);
        const canvasY = Math.floor(y * scaleY);

        // 执行填充
        this.floodFill(canvasX, canvasY);
      })
      .exec();
  },
  // 添加判断是否为白色区域的方法
  isWhiteArea: function (color) {
    const whiteTolerance = this.data.whiteTolerance;

    // 判断颜色不是黑色
    // 白色的 RGB 值是 (255, 255, 255)
    const isCloseToWhite =
      Math.abs(0 - color[0]) <= whiteTolerance &&
      Math.abs(0 - color[1]) <= whiteTolerance &&
      Math.abs(0 - color[2]) <= whiteTolerance;

    return !isCloseToWhite;
  },
  // 修改 Flood Fill 算法实现
  floodFill: function (startX, startY) {
    const { canvas, context, fillHistory } = this.data;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // 保存当前画布状态到历史记录
    fillHistory.push(context.getImageData(0, 0, canvas.width, canvas.height));

    // 获取起始点的颜色
    const startPos = (startY * canvas.width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];

    // 检查是否为可填充区域（接近白色）
    // if (!this.isWhiteArea([startR, startG, startB])) {
    //   console.log("Not a fillable area");
    //   return;
    // }

    // 获取目标颜色
    const targetColor = this.hexToRgb(this.data.currentColor);
    if (!targetColor) {
      console.log("Invalid target color");
      return;
    }

    // 如果起始点颜色和目标颜色相同，则不需要填充
    // if (
    //   this.colorMatch(
    //     [startR, startG, startB],
    //     [targetColor.r, targetColor.g, targetColor.b]
    //   )
    // ) {
    //   console.log("Same color, no need to fill");
    //   return;
    // }

    // 创建堆栈并添加起始点
    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;

      if (visited.has(key)) continue;

      const pos = (y * canvas.width + x) * 4;

      // 检查当前像素是否需要填充
      if (
        x >= 0 &&
        x < canvas.width &&
        y >= 0 &&
        y < canvas.height &&
        this.colorMatch(
          [pixels[pos], pixels[pos + 1], pixels[pos + 2]],
          [startR, startG, startB]
        ) &&
        this.isWhiteArea([pixels[pos], pixels[pos + 1], pixels[pos + 2]])
      ) {
        // 确保只填充白色区域

        // 填充当前像素
        pixels[pos] = targetColor.r;
        pixels[pos + 1] = targetColor.g;
        pixels[pos + 2] = targetColor.b;
        pixels[pos + 3] = 255;

        visited.add(key);

        // 检查周围的像素（包括对角线）
        const neighbors = [
          [x + 1, y], // 右
          [x - 1, y], // 左
          [x, y + 1], // 下
          [x, y - 1], // 上
          [x + 1, y + 1], // 右下
          [x + 1, y - 1], // 右上
          [x - 1, y + 1], // 左下
          [x - 1, y - 1], // 左上
        ];

        for (const [newX, newY] of neighbors) {
          if (
            newX >= 0 &&
            newX < canvas.width &&
            newY >= 0 &&
            newY < canvas.height
          ) {
            const newKey = `${newX},${newY}`;
            if (!visited.has(newKey)) {
              const newPos = (newY * canvas.width + newX) * 4;
              if (
                this.colorMatch(
                  [pixels[newPos], pixels[newPos + 1], pixels[newPos + 2]],
                  [startR, startG, startB],
                  true
                ) &&
                this.isWhiteArea([
                  pixels[newPos],
                  pixels[newPos + 1],
                  pixels[newPos + 2],
                ])
              ) {
                stack.push([newX, newY]);
              }
            }
          }
        }
      }
    } // 更新画布
    context.putImageData(imageData, 0, 0);
  },

  // 改进的颜色匹配方法
  colorMatch: function (color1, color2, isBoundary = false) {
    const tolerance = isBoundary
      ? this.data.tolerance * 1.5
      : this.data.tolerance;

    // 计算颜色差异
    const dr = Math.abs(color1[0] - color2[0]);
    const dg = Math.abs(color1[1] - color2[1]);
    const db = Math.abs(color1[2] - color2[2]);

    // 使用加权平均来判断颜色相似度
    const weightedDiff = dr * 0.299 + dg * 0.587 + db * 0.114;

    return weightedDiff <= tolerance;
  },

  // 将十六进制颜色转换为RGB
  hexToRgb: function (hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  selectColor(event) {
    this.setData({
      currentColor: event.currentTarget.dataset.color,
    });
  },
  showColorPicker() {
    console.log(1);
    const query = wx.createSelectorQuery();
    query
      .select(".open-popup-btn")
      .boundingClientRect((rect) => {
        this.setData({
          showPopup: true,
        });
        this.drawColorSpectrum();
      })
      .exec();
    console.log(2);
  },
  hideColorPicker() {
    this.setData({
      showPopup: false,
    });
  },
  drawColorSpectrum() {
    const ctx = wx.createCanvasContext("colorSpectrumCanvas", this);
    const gradient = ctx.createLinearGradient(0, 0, 375, 0);
    gradient.addColorStop(0, "red");
    gradient.addColorStop(0.16, "orange");
    gradient.addColorStop(0.33, "yellow");
    gradient.addColorStop(0.5, "green");
    gradient.addColorStop(0.66, "cyan");
    gradient.addColorStop(0.83, "blue");
    gradient.addColorStop(1, "purple");
    ctx.setFillStyle(gradient);
    ctx.fillRect(0, 0, 375, 50);
    ctx.draw();
  },
  selectColorFromSpectrum(event) {
    const x = event.detail.x;
    const y = event.detail.y;
    wx.canvasGetImageData({
      canvasId: "colorSpectrumCanvas",
      x: x,
      y: y,
      width: 1,
      height: 1,
      success: (res) => {
        const r = res.data[0];
        const g = res.data[1];
        const b = res.data[2];
        const color = `#${this.rgbToHex(r)}${this.rgbToHex(g)}${this.rgbToHex(
          b
        )}`;
        this.setData({
          currentColor: color,
          showPopup: false,
        });
      },
    });
  },
  rgbToHex(value) {
    const hex = value.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  },
  // 撤销填色
  undoFill: function () {
    const { canvas, context, fillHistory } = this.data;
    if (fillHistory.length > 0) {
      const lastImageData = fillHistory.pop(); // 取出最后一次的画布状态
      context.putImageData(lastImageData, 0, 0); // 恢复画布状态
    }
  },
  // 处理光谱渐变色区域点击
  onSpectrumClick: function (e) {
    const { spectrumCanvas, spectrumCtx } = this.data;
    if (!spectrumCanvas || !spectrumCtx) return;

    const query = wx.createSelectorQuery();
    query
      .select("#spectrumCanvas")
      .boundingClientRect((rect) => {
        // 计算点击位置相对于canvas的坐标
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;

        // 获取点击位置的颜色数据
        const imageData = spectrumCtx.getImageData(x, y, 1, 1).data;
        const r = imageData[0];
        const g = imageData[1];
        const b = imageData[2];
        const hexColor = `#${this.rgbToHex(r)}${this.rgbToHex(
          g
        )}${this.rgbToHex(b)}`;
        this.setData({
          currentColor: hexColor,
        });
      })
      .exec();
  },
});

// app.js

App({
    onLaunch: function () {
        // 应用启动时的逻辑
        console.log('小程序启动');
    },
    onShow: function (options) {
        // 应用显示时的逻辑
        console.log('小程序显示', options);
    },
    onHide: function () {
        // 应用隐藏时的逻辑
        console.log('小程序隐藏');
    },
    globalData: {
        userInfo: null
    }
});
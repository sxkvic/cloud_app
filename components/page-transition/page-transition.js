// components/page-transition/page-transition.js
Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 加载文字
    text: {
      type: String,
      value: '加载中...'
    }
  },

  data: {
    animating: false
  },

  observers: {
    'show': function(newVal) {
      if (newVal) {
        this.setData({ animating: true });
      } else {
        // 延迟隐藏，等待动画完成
        setTimeout(() => {
          this.setData({ animating: false });
        }, 300);
      }
    }
  },

  methods: {
    // 显示加载动画
    showLoading(text) {
      this.setData({
        show: true,
        text: text || '加载中...'
      });
    },

    // 隐藏加载动画
    hideLoading() {
      this.setData({
        show: false
      });
    }
  }
});

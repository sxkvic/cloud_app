// pages/bill-detail/bill-detail.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');

Page({
  data: {
    billId: '',
    billDetail: null,
    loading: true
  },

  onLoad(options) {
    console.log('账单详情页面加载，参数:', options);
    if (options.id) {
      this.setData({ billId: options.id });
      this.loadBillDetail();
    } else {
      message.error('缺少账单ID');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载账单详情
  async loadBillDetail() {
    try {
      wx.showLoading({ title: '加载中...' });
      console.log('获取账单详情，ID:', this.data.billId);

      const result = await API.getCustomerBillDetail(this.data.billId);
      const billDetail = result.data;

      wx.hideLoading();
      console.log('账单详情:', billDetail);

      this.setData({
        billDetail: billDetail,
        loading: false
      });

    } catch (error) {
      wx.hideLoading();
      console.error('获取账单详情失败:', error);
      message.error('获取账单详情失败');
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 立即支付
  payNow() {
    if (!this.data.billDetail) {
      message.error('账单信息未加载');
      return;
    }

    const amount = parseFloat(this.data.billDetail.amount);
    
    wx.showModal({
      title: '确认支付',
      content: `账单金额：¥${amount.toFixed(2)}\n\n确认支付此账单？`,
      confirmText: '确认支付',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processPayment(amount);
        }
      }
    });
  },

  // 处理支付
  processPayment(amount) {
    wx.showLoading({
      title: '正在支付...'
    });

    // 模拟支付过程
    setTimeout(() => {
      wx.hideLoading();
      message.success('支付成功！');
      
      // 更新账单状态
      this.setData({
        'billDetail.bill_status': 1
      });

      setTimeout(() => {
        wx.showModal({
          title: '支付完成',
          content: `支付成功！\n支付金额：¥${amount.toFixed(2)}\n支付时间：${new Date().toLocaleString()}`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 返回账单列表
            wx.navigateBack();
          }
        });
      }, 1000);
    }, 2000);
  }
});

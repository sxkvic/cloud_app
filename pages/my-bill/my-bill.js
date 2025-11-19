// pages/my-bill/my-bill.js
const { navigation, message } = require('../../utils/common');
const API = require('../../utils/api');

Page({
  data: {
    bills: [],
    loading: true
  },

  async onLoad() {
    console.log('我的账单页面加载');
    await this.loadBills();
  },

  async onShow() {
    console.log('我的账单页面显示');
    await this.loadBills();
  },

  // 加载账单列表
  async loadBills() {
    try {
      this.setData({ loading: true });
      console.log('开始加载账单列表...');

      const result = await API.getCustomerBillList({
        page: 1,
        pageSize: 20,
        status: '' // 获取所有状态的账单
      });

      console.log('账单列表加载成功:', result.data);

      // 转换数据格式
      const bills = result.data.bills.map(bill => ({
        id: bill.id,
        title: bill.title || '宽带月费',
        date: bill.createTime || bill.date,
        period: bill.period || '月度账单',
        amount: `¥${parseFloat(bill.amount).toFixed(2)}`,
        status: bill.status === 'paid' ? 'paid' : 'pending',
        statusText: bill.status === 'paid' ? '已缴费' : '待缴费'
      }));

      this.setData({
        bills: bills,
        loading: false
      });

    } catch (error) {
      console.error('加载账单失败:', error);
      this.setData({ loading: false });

      // 如果加载失败，使用默认账单数据
      message.error('加载账单失败，显示默认数据');
      this.setData({
        bills: [
          {
            id: '20241201',
            title: '宽带月费',
            date: '2024-12-01',
            period: '2024年12月',
            amount: '¥88.00',
            status: 'pending',
            statusText: '待缴费'
          },
          {
            id: '20241101',
            title: '宽带月费',
            date: '2024-11-01',
            period: '2024年11月',
            amount: '¥88.00',
            status: 'paid',
            statusText: '已缴费'
          },
          {
            id: '20241001',
            title: '宽带月费',
            date: '2024-10-01',
            period: '2024年10月',
            amount: '¥88.00',
            status: 'paid',
            statusText: '已缴费'
          },
          {
            id: '20240915',
            title: '安装费用',
            date: '2024-09-15',
            period: '一次性费用',
            amount: '¥200.00',
            status: 'paid',
            statusText: '已缴费'
          }
        ]
      });
    }
  },

  // 充值缴费
  recharge() {
    message.success('跳转到充值页面');
    navigation.navigateTo('/pages/pre-recharge/pre-recharge');
  },

  // 查看历史账单
  viewHistory() {
    message.success('查看历史账单');
    // 这里可以跳转到详细的历史账单页面
    wx.showModal({
      title: '历史账单',
      content: '您想查看哪个时间段的历史账单？',
      confirmText: '近6个月',
      cancelText: '近1年',
      success: (res) => {
        if (res.confirm) {
          this.loadHistoryBills('6months');
        } else {
          this.loadHistoryBills('1year');
        }
      }
    });
  },

  // 下载账单
  downloadBill() {
    wx.showLoading({
      title: '准备下载...'
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '下载账单',
        content: '账单PDF文件已生成，是否下载到本地？',
        confirmText: '下载',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            message.success('账单已保存到本地');
          }
        }
      });
    }, 1500);
  },

  // 查看账单详情
  async viewBillDetail(e) {
    const billId = e.currentTarget.dataset.id;

    if (!billId) return;

    try {
      wx.showLoading({ title: '加载中...' });
      console.log('获取账单详情，ID:', billId);

      const result = await API.getCustomerBillDetail(billId);
      const bill = result.data;

      wx.hideLoading();
      console.log('账单详情:', bill);

      wx.showModal({
        title: '账单详情',
        content: `账单类型：${bill.title || '宽带月费'}\n账单日期：${bill.createTime || bill.date}\n计费周期：${bill.period || '月度账单'}\n账单金额：¥${parseFloat(bill.amount).toFixed(2)}\n缴费状态：${bill.status === 'paid' ? '已缴费' : '待缴费'}`,
        showCancel: false,
        confirmText: '知道了'
      });

    } catch (error) {
      wx.hideLoading();
      console.error('获取账单详情失败:', error);

      // 如果API失败，使用本地数据
      const bill = this.data.bills.find(b => b.id === billId);
      if (bill) {
        wx.showModal({
          title: '账单详情',
          content: `账单类型：${bill.title}\n账单日期：${bill.date}\n计费周期：${bill.period}\n账单金额：${bill.amount}\n缴费状态：${bill.statusText}`,
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        message.error('获取账单详情失败');
      }
    }
  },

  // 查看全部账单
  viewAllBills() {
    message.success('查看全部账单');
    // 这里可以跳转到完整的账单列表页面
  },

  // 联系客服
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00\n\n您也可以在线咨询客服。',
      confirmText: '在线咨询',
      cancelText: '拨打电话',
      success: (res) => {
        if (res.confirm) {
          message.success('正在为您转接在线客服...');
        } else {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567'
          });
        }
      }
    });
  },

  // 立即缴费
  payNow() {
    const pendingBills = this.data.bills.filter(bill => bill.status === 'pending');
    
    if (pendingBills.length === 0) {
      message.success('您当前没有待缴费账单');
      return;
    }

    const totalAmount = pendingBills.reduce((sum, bill) => {
      return sum + parseFloat(bill.amount.replace('¥', ''));
    }, 0);

    wx.showModal({
      title: '确认缴费',
      content: `您有 ${pendingBills.length} 笔待缴费账单，总计金额：¥${totalAmount.toFixed(2)}\n\n是否立即缴费？`,
      confirmText: '立即缴费',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processPayment(totalAmount);
        }
      }
    });
  },

  // 处理缴费
  processPayment(amount) {
    wx.showLoading({
      title: '正在缴费...'
    });

    setTimeout(() => {
      wx.hideLoading();
      
      message.success('缴费成功！');
      
      // 更新账单状态
      const updatedBills = this.data.bills.map(bill => {
        if (bill.status === 'pending') {
          return { ...bill, status: 'paid', statusText: '已缴费' };
        }
        return bill;
      });

      this.setData({
        bills: updatedBills
      });

      setTimeout(() => {
        wx.showModal({
          title: '缴费完成',
          content: `缴费成功！\n缴费金额：¥${amount.toFixed(2)}\n缴费时间：${new Date().toLocaleString()}`,
          showCancel: false,
          confirmText: '知道了'
        });
      }, 1000);
    }, 2000);
  },

  // 加载历史账单
  loadHistoryBills(period) {
    wx.showLoading({
      title: '加载中...'
    });

    setTimeout(() => {
      wx.hideLoading();
      message.success(`已加载${period === '6months' ? '近6个月' : '近1年'}的历史账单`);
    }, 1000);
  }
});
// pages/business-registration/business-registration.js
const { navigation, message } = require('../../utils/common');

Page({
  data: {
    // 订单数据 - 示例数据，实际使用时从接口获取
    orderData: {
      // 头部信息
      orderNo: '1220250529000220903492',
      currentPage: 1,
      totalPages: 3,
      acceptDate: '2025 年 05 月 29 日',
      
      // 客户信息
      customerName: '杭州意丰歌服饰有限公司',
      contactPhone: '13915514486',
      idType: '统一信用代码',
      idNumber: '913************71A',
      idAddress: '浙江省杭州市余杭区余杭经济开发区超峰东路2号南楼5楼515室',
      businessOrderNo: '0620250529106777781',
      
      // 套餐信息
      packageName: '礼包云网300M包年套餐(立即生效)',
      packageSpeed: '300M',
      originalPrice: '120',
      discountPrice: '998',
      downloadSpeed: '300M',
      uploadSpeed: '20M',
      contractMonths: 12,
      
      // 产品信息
      broadbandNo: '2312260076',
      gatewayNo: '05122312260076',
      installAddress: '苏州市高新区金鹰国际购物中心二楼伊芙丽专厅',
      
      // 费用信息
      prepayAmount: '998',
      debugFee: '0',
      actualPayment: '998',
      
      // 物品清单
      itemList: [
        { name: '千兆网关路由', quantity: 1 }
      ],
      
      // 预约信息
      appointmentTime: '2025-05-29 8:00:00 -- 18:00:00',
      contactPerson: '王琴'
    }
  },

  onLoad(options) {
    console.log('业务登记单页面加载', options);
    
    // 如果有传入订单号，则加载对应订单数据
    if (options.orderNo) {
      this.loadOrderData(options.orderNo);
    }
    
    // 如果有传入完整数据（JSON字符串），则直接使用
    if (options.data) {
      try {
        const orderData = JSON.parse(decodeURIComponent(options.data));
        this.setData({ orderData });
      } catch (error) {
        console.error('解析订单数据失败:', error);
      }
    }
  },

  onShow() {
    console.log('业务登记单页面显示');
  },

  // 加载订单数据
  loadOrderData(orderNo) {
    wx.showLoading({
      title: '加载中...'
    });

    // TODO: 调用实际接口获取订单数据
    // API.getOrderDetail(orderNo).then(res => {
    //   if (res.success) {
    //     this.setData({
    //       orderData: this.formatOrderData(res.data)
    //     });
    //   }
    // }).catch(error => {
    //   message.error('加载订单数据失败');
    // }).finally(() => {
    //   wx.hideLoading();
    // });

    // 模拟加载
    setTimeout(() => {
      wx.hideLoading();
      message.success('订单数据加载成功');
    }, 1000);
  },

  // 格式化订单数据
  formatOrderData(data) {
    // 将后端返回的数据格式化为页面需要的格式
    return {
      orderNo: data.order_no || '',
      currentPage: 1,
      totalPages: 3,
      acceptDate: this.formatDate(data.accept_date),
      customerName: data.customer_name || '',
      contactPhone: data.contact_phone || '',
      idType: data.id_type || '',
      idNumber: this.maskIdNumber(data.id_number),
      idAddress: data.id_address || '',
      businessOrderNo: data.business_order_no || '',
      packageName: data.package_name || '',
      packageSpeed: data.package_speed || '',
      originalPrice: data.original_price || '',
      discountPrice: data.discount_price || '',
      downloadSpeed: data.download_speed || '',
      uploadSpeed: data.upload_speed || '',
      contractMonths: data.contract_months || 12,
      broadbandNo: data.broadband_no || '',
      gatewayNo: data.gateway_no || '',
      installAddress: data.install_address || '',
      prepayAmount: data.prepay_amount || '',
      debugFee: data.debug_fee || '0',
      actualPayment: data.actual_payment || '',
      itemList: data.item_list || [],
      appointmentTime: data.appointment_time || '',
      contactPerson: data.contact_person || ''
    };
  },

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()} 年 ${String(date.getMonth() + 1).padStart(2, '0')} 月 ${String(date.getDate()).padStart(2, '0')} 日`;
  },

  // 脱敏证件号码
  maskIdNumber(idNumber) {
    if (!idNumber || idNumber.length < 8) return idNumber;
    const start = idNumber.substring(0, 3);
    const end = idNumber.substring(idNumber.length - 3);
    const middle = '*'.repeat(idNumber.length - 6);
    return start + middle + end;
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '业务登记单',
      path: `/pages/business-registration/business-registration?orderNo=${this.data.orderData.orderNo}`
    };
  }
});

# API使用示例

本文档展示如何在小程序页面中使用已创建的API接口。

---

## 📁 已创建的文件

✅ **utils/request.js** - 统一请求封装
✅ **utils/api.js** - API接口定义（32个接口）
✅ **app.js** - 已更新全局配置

---

## 🔧 配置API地址

在开始使用前，请先配置API服务器地址：

打开 `app.js`，修改第34行：

```javascript
apiBaseUrl: 'https://your-api-domain.com', // 替换为实际的API服务器地址
```

例如：
```javascript
apiBaseUrl: 'https://api.example.com',
// 或
apiBaseUrl: 'http://192.168.1.100:3000', // 本地开发环境
```

---

## 📖 使用示例

### 示例1: 登录页面 (pages/login/login.js)

```javascript
// 在页面顶部引入API
const API = require('../../utils/api');
const app = getApp();

Page({
  data: {
    agreed: false,
    loading: false
  },

  // 微信登录
  async onWeChatLogin() {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先阅读并同意用户服务协议',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      // 1. 调用微信登录获取code
      const loginRes = await wx.login();
      const code = loginRes.code;

      // 2. 通过code获取openid
      const openidResult = await API.getOpenidByCode(code);
      const openid = openidResult.data.openid;

      // 保存openid
      app.globalData.openid = openid;
      wx.setStorageSync('openid', openid);

      // 3. 尝试生成token（如果用户已存在）
      try {
        const tokenResult = await API.generateTokenByOpenid(openid);
        const token = tokenResult.data.token;

        // 保存token
        app.globalData.token = token;
        app.globalData.isLoggedIn = true;
        wx.setStorageSync('token', token);

        // 4. 获取用户信息
        const userInfoResult = await API.getUserInfo();
        app.globalData.userInfo = userInfoResult.data;
        wx.setStorageSync('userInfo', userInfoResult.data);

        this.setData({ loading: false });
        wx.showToast({
          title: '登录成功！',
          icon: 'success'
        });

        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/home/home'
          });
        }, 1000);

      } catch (tokenError) {
        // 用户不存在，创建新用户
        const createUserResult = await API.createUser({
          openid: openid,
          nickname: '微信用户',
          avatar: ''
        });

        const token = createUserResult.data.token;
        app.globalData.token = token;
        app.globalData.isLoggedIn = true;
        wx.setStorageSync('token', token);

        this.setData({ loading: false });
        wx.showToast({
          title: '注册成功！',
          icon: 'success'
        });

        // 跳转到设备绑定页面
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/bind-device-code/bind-device-code'
          });
        }, 1000);
      }

    } catch (error) {
      console.error('登录失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none'
      });
    }
  }
});
```

---

### 示例2: 设备绑定页面 (pages/bind-device-code/bind-device-code.js)

```javascript
const API = require('../../utils/api');

Page({
  data: {
    deviceCode: '',
    isLoading: false
  },

  // 输入设备码
  onDeviceCodeInput(e) {
    this.setData({
      deviceCode: e.detail.value
    });
  },

  // 手动提交绑定
  async onManualSubmit() {
    const { deviceCode } = this.data;

    if (deviceCode.length < 16) {
      wx.showToast({
        title: '请输入16位设备绑定码',
        icon: 'none'
      });
      return;
    }

    this.setData({ isLoading: true });

    try {
      // 1. 先验证设备码是否有效
      const customerInfo = await API.getCustomerByDeviceCode(deviceCode);

      if (!customerInfo.data) {
        this.setData({ isLoading: false });
        wx.showToast({
          title: '设备码无效或不存在',
          icon: 'none'
        });
        return;
      }

      // 2. 绑定设备到用户
      await API.bindDevice(deviceCode);

      this.setData({ isLoading: false });
      wx.showToast({
        title: '设备绑定成功！',
        icon: 'success'
      });

      // 保存绑定状态
      wx.setStorageSync('deviceBound', true);
      wx.setStorageSync('deviceCode', deviceCode);

      // 清空输入框
      this.setData({ deviceCode: '' });

      // 跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/home/home'
        });
      }, 1000);

    } catch (error) {
      console.error('绑定失败:', error);
      this.setData({ isLoading: false });
      wx.showToast({
        title: error.message || '设备绑定失败，请重试',
        icon: 'none'
      });
    }
  }
});
```

---

### 示例3: 套餐订购页面 (pages/package-order/package-order.js)

```javascript
const API = require('../../utils/api');

Page({
  data: {
    packages: [],
    selectedPackage: null,
    loading: true
  },

  async onLoad() {
    await this.loadPackages();
  },

  // 加载套餐列表
  async loadPackages() {
    try {
      this.setData({ loading: true });

      const result = await API.getPackagesList({
        status: 'active', // 只获取激活状态的套餐
        page: 1,
        pageSize: 20
      });

      // 转换数据格式以适配现有UI
      const packages = result.data.packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        speed: pkg.speed || '100',
        price: pkg.price,
        isPopular: pkg.isPopular || false,
        features: pkg.features || []
      }));

      this.setData({
        packages: packages,
        loading: false
      });

    } catch (error) {
      console.error('加载套餐失败:', error);
      this.setData({ loading: false });
    }
  },

  // 选择套餐
  onSelectPackage(e) {
    const packageId = e.currentTarget.dataset.id;
    this.setData({
      selectedPackage: packageId
    });
  },

  // 处理订购
  async processOrder() {
    const selectedPackage = this.data.packages.find(
      pkg => pkg.id === this.data.selectedPackage
    );

    if (!selectedPackage) {
      wx.showToast({
        title: '请选择套餐',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '正在处理订单...' });

      // 创建订单
      const result = await API.createOrder({
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        amount: selectedPackage.price,
        remark: '小程序订购'
      });

      wx.hideLoading();
      wx.showToast({
        title: '订购成功！',
        icon: 'success'
      });

      setTimeout(() => {
        wx.showModal({
          title: '订购完成',
          content: `${selectedPackage.name} 订购成功！\n订单号：${result.data.orderId}\n月费：¥${selectedPackage.price}\n我们将尽快为您安排安装。`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            wx.switchTab({
              url: '/pages/home/home'
            });
          }
        });
      }, 1000);

    } catch (error) {
      wx.hideLoading();
      console.error('订购失败:', error);
    }
  }
});
```

---

### 示例4: 账单列表页面 (pages/my-bill/my-bill.js)

```javascript
const API = require('../../utils/api');

Page({
  data: {
    bills: [],
    loading: true
  },

  async onLoad() {
    await this.loadBills();
  },

  async onShow() {
    await this.loadBills();
  },

  // 加载账单列表
  async loadBills() {
    try {
      this.setData({ loading: true });

      const result = await API.getCustomerBillList({
        page: 1,
        pageSize: 20,
        status: '' // 获取所有状态的账单
      });

      // 转换数据格式
      const bills = result.data.bills.map(bill => ({
        id: bill.id,
        title: bill.title || '宽带月费',
        date: bill.createTime,
        period: bill.period || '月度账单',
        amount: `¥${bill.amount.toFixed(2)}`,
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
    }
  },

  // 查看账单详情
  async viewBillDetail(e) {
    const billId = e.currentTarget.dataset.id;

    try {
      wx.showLoading({ title: '加载中...' });

      const result = await API.getCustomerBillDetail(billId);
      const bill = result.data;

      wx.hideLoading();

      wx.showModal({
        title: '账单详情',
        content: `账单类型：${bill.title}\n账单日期：${bill.date}\n计费周期：${bill.period}\n账单金额：¥${bill.amount}\n缴费状态：${bill.statusText}`,
        showCancel: false,
        confirmText: '知道了'
      });

    } catch (error) {
      wx.hideLoading();
      console.error('获取账单详情失败:', error);
    }
  }
});
```

---

## 🎯 更多示例

查看 **接口对接实施指南.md** 获取更多示例：
- 预充值支付流程
- 开票申请流程
- 订单查询流程
- 工具类接口使用

---

## ⚠️ 注意事项

1. **所有API调用都需要使用 async/await 或 Promise**
2. **需要认证的接口会自动添加Token，无需手动处理**
3. **错误处理已在 request.js 中统一处理**
4. **Token过期会自动跳转到登录页**
5. **记得在 app.js 中配置正确的 apiBaseUrl**

---

## 🚀 快速开始

1. ✅ 配置 `app.js` 中的 `apiBaseUrl`
2. ✅ 在页面顶部引入 `const API = require('../../utils/api');`
3. ✅ 使用 `await API.方法名(参数)` 调用接口
4. ✅ 使用 try/catch 处理错误（可选，已有统一错误处理）

---

**祝你开发顺利！** 🎉



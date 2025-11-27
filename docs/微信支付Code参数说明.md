# 微信支付 Code 参数说明

## 优化内容

### 问题
预付款支付时缺少微信 `code` 参数，导致后端无法正确处理支付请求。

### 解决方案
在调用支付接口前，先通过 `wx.login()` 获取微信 `code`，并将其传递给后端。

---

## 实施内容

### 修改文件：`pages/pre-recharge/pre-recharge.js`

#### 优化前 ❌
```javascript
async handleDirectPayment(orderData, customerInfo) {
  try {
    wx.showLoading({ title: '正在调起支付...' });
    
    // 获取用户的openid
    const openid = wx.getStorageSync('openid') || app.globalData.openid;
    
    if (!openid) {
      message.error('未获取到用户信息，请重新登录');
      return;
    }
    
    // 调用小程序支付接口
    const paymentParams = {
      payment_type: 1,
      order_id: orderData.order_no,
      customer_id: customerInfo.id,
      device_no: this.data.deviceCode,
      orderType: 2,
      openid: openid,
      amount: parseFloat(this.data.rechargeAmount)
      // ❌ 缺少 code 参数
    };
    
    const payResult = await API.createMiniprogramPayment(paymentParams);
  }
}
```

#### 优化后 ✅
```javascript
async handleDirectPayment(orderData, customerInfo) {
  try {
    wx.showLoading({ title: '正在调起支付...' });
    
    // ✅ 获取微信 code
    const loginRes = await new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      });
    });
    
    const code = loginRes.code;
    console.log('获取微信code:', code);
    
    if (!code) {
      wx.hideLoading();
      message.error('获取微信授权失败，请重试');
      return;
    }
    
    // 获取用户的openid
    const openid = wx.getStorageSync('openid') || app.globalData.openid;
    
    if (!openid) {
      wx.hideLoading();
      message.error('未获取到用户信息，请重新登录');
      return;
    }
    
    // 调用小程序支付接口
    const paymentParams = {
      payment_type: 1,
      order_id: orderData.order_no,
      customer_id: customerInfo.id,
      device_no: this.data.deviceCode,
      orderType: 2,
      openid: openid,
      code: code, // ✅ 添加微信 code
      amount: parseFloat(this.data.rechargeAmount)
    };
    
    const payResult = await API.createMiniprogramPayment(paymentParams);
  }
}
```

---

## 微信 Code 说明

### 什么是微信 Code？

微信 `code` 是通过 `wx.login()` 获取的临时登录凭证，用于：
1. 换取用户的 `openid` 和 `session_key`
2. 验证用户身份
3. 确保支付请求的安全性

### Code 的特点

| 特性 | 说明 |
|------|------|
| **有效期** | 5 分钟 |
| **使用次数** | 一次性，使用后失效 |
| **获取方式** | `wx.login()` |
| **用途** | 换取 openid、session_key |

### 为什么需要 Code？

**安全性：**
- Code 是临时凭证，即使被截获也会很快失效
- 每次支付都获取新的 code，确保安全

**身份验证：**
- 后端通过 code 验证用户身份
- 确保支付请求来自真实用户

**支付流程：**
```
用户点击支付
  ↓
wx.login() 获取 code
  ↓
将 code 传给后端
  ↓
后端用 code 换取 openid
  ↓
后端调用微信支付接口
  ↓
返回支付参数给前端
  ↓
前端调起微信支付
```

---

## 完整的支付流程

### 1. 获取微信 Code
```javascript
const loginRes = await new Promise((resolve, reject) => {
  wx.login({
    success: resolve,
    fail: reject
  });
});

const code = loginRes.code;
```

### 2. 获取 OpenID
```javascript
const openid = wx.getStorageSync('openid') || app.globalData.openid;
```

### 3. 组装支付参数
```javascript
const paymentParams = {
  payment_type: 1,        // 微信支付
  order_id: orderData.order_no,
  customer_id: customerInfo.id,
  device_no: this.data.deviceCode,
  orderType: 2,           // 预充值
  openid: openid,         // 用户 openid
  code: code,             // ✅ 微信 code
  amount: parseFloat(this.data.rechargeAmount)
};
```

### 4. 调用支付接口
```javascript
const payResult = await API.createMiniprogramPayment(paymentParams);
```

### 5. 调起微信支付
```javascript
wx.requestPayment({
  timeStamp: payResult.data.timeStamp,
  nonceStr: payResult.data.nonceStr,
  package: payResult.data.package,
  signType: payResult.data.signType,
  paySign: payResult.data.paySign,
  success: (payRes) => {
    console.log('支付成功', payRes);
  },
  fail: (payErr) => {
    console.error('支付失败', payErr);
  }
});
```

---

## 错误处理

### 1. Code 获取失败
```javascript
if (!code) {
  wx.hideLoading();
  console.error('未获取到微信code');
  message.error('获取微信授权失败，请重试');
  return;
}
```

### 2. OpenID 获取失败
```javascript
if (!openid) {
  wx.hideLoading();
  console.error('未获取到openid');
  message.error('未获取到用户信息，请重新登录');
  return;
}
```

### 3. 支付参数不完整
```javascript
const requiredParams = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign'];
const missingParams = requiredParams.filter(param => !payResult.data[param]);

if (missingParams.length > 0) {
  console.error('缺少必需的支付参数:', missingParams);
  message.error('支付参数不完整: ' + missingParams.join(', '));
  return;
}
```

---

## 日志输出

### 关键日志
```javascript
console.log('获取微信code:', code);
console.log('获取openid:', openid);
console.log('支付参数:', paymentParams);
console.log('支付接口返回:', payResult);
```

### 日志示例
```
获取微信code: 071abc123def456
获取openid: oABC123DEF456GHI789
支付参数: {
  payment_type: 1,
  order_id: "ORD20251127001",
  customer_id: 37,
  device_no: "DEV00845211",
  orderType: 2,
  openid: "oABC123DEF456GHI789",
  code: "071abc123def456",
  amount: 100
}
支付接口返回: {
  success: true,
  data: {
    timeStamp: "1701072000",
    nonceStr: "abc123def456",
    package: "prepay_id=wx27112713...",
    signType: "RSA",
    paySign: "ABC123DEF456..."
  }
}
```

---

## 其他页面检查

### 套餐订购页面
- ✅ 无需修改
- 原因：只创建订单，不涉及支付

### 业务申请页面
- ✅ 无需修改
- 原因：只提交申请，不涉及支付

### 预充值页面
- ✅ 已修改
- 添加了微信 code 参数

---

## 总结

### 核心修改
1. **获取微信 code** - 通过 `wx.login()` 获取
2. **传递 code 参数** - 在支付参数中添加 `code` 字段
3. **错误处理** - 处理 code 获取失败的情况

### 优化效果
- ✅ **完整参数** - 支付请求包含所有必需参数
- ✅ **安全性** - 每次支付都使用新的临时凭证
- ✅ **可靠性** - 完善的错误处理机制

现在预充值支付流程已经包含微信 code 参数了！🎉

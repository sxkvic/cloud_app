# deviceCode 迁移到 device_no 完整说明

## 问题背景

用户反馈：
> deviceCode应该已经被替换成device_no了才对啊，因为deviceCode是之前错误的参数。而且我绑定成功了就需要将数据存起来才对吧

## 问题分析

### 1. 参数混乱
- ❌ **旧参数 `deviceCode`**：之前错误使用的参数名
- ✅ **新参数 `device_no`**：正确的设备编号字段

### 2. 数据未存储
- 绑定成功后只存储了 `deviceCode`
- 没有存储完整的设备信息（`device_info`, `customer_info`, `binding_info`）
- 登录时也没有查询和存储完整信息

### 3. 缓存残留
- 旧的 `deviceCode` 缓存没有被清理
- 导致新旧参数混用

---

## 解决方案

### 1. ✅ 完全移除 `deviceCode`

**修改的位置：**

#### app.js - 全局数据定义
```javascript
// 旧的
globalData: {
  deviceCode: null,
  deviceBound: false
}

// 新的
globalData: {
  device_no: null,
  device_info: null,
  customer_info: null,
  binding_info: null,
  deviceBound: false
}
```

#### app.js - 启动时恢复数据
```javascript
// 旧的
const deviceCode = wx.getStorageSync('deviceCode');
if (deviceBound && deviceCode) {
  this.globalData.deviceCode = deviceCode;
}

// 新的
const device_no = wx.getStorageSync('device_no');
const device_info = wx.getStorageSync('device_info');
const customer_info = wx.getStorageSync('customer_info');
const binding_info = wx.getStorageSync('binding_info');

if (deviceBound && device_no) {
  this.globalData.device_no = device_no;
  this.globalData.device_info = device_info;
  this.globalData.customer_info = customer_info;
  this.globalData.binding_info = binding_info;
}

// 清理旧缓存
const oldDeviceCode = wx.getStorageSync('deviceCode');
if (oldDeviceCode) {
  wx.removeStorageSync('deviceCode');
}
```

---

### 2. ✅ 绑定成功后存储完整数据

#### pages/bind-device-code/bind-device-code.js

**绑定流程：**
```javascript
async onManualSubmit() {
  try {
    // 1. 清除旧缓存（包括旧的 deviceCode）
    wx.removeStorageSync('deviceBound');
    wx.removeStorageSync('deviceCode');  // ← 清除旧参数
    wx.removeStorageSync('device_no');
    wx.removeStorageSync('device_info');
    wx.removeStorageSync('customer_info');
    wx.removeStorageSync('binding_info');
    
    // 2. 调用绑定接口
    await API.bindDevice(deviceCode);
    
    // 3. 查询完整的设备信息
    const deviceInfoResult = await API.getCustomerByDeviceCode(deviceCode);
    
    if (!deviceInfoResult.success || !deviceInfoResult.data) {
      throw new Error('获取设备信息失败');
    }
    
    const { customer, binding_info, device_info } = deviceInfoResult.data;
    
    // 4. 存储完整信息（不再存储 deviceCode）
    wx.setStorageSync('deviceBound', true);
    wx.setStorageSync('device_no', device_info?.device_no || deviceCode);
    wx.setStorageSync('device_info', device_info);
    wx.setStorageSync('customer_info', customer);
    wx.setStorageSync('binding_info', binding_info);
    
    // 5. 同步到全局数据
    app.globalData.deviceBound = true;
    app.globalData.device_no = device_info?.device_no || deviceCode;
    app.globalData.device_info = device_info;
    app.globalData.customer_info = customer;
    app.globalData.binding_info = binding_info;
    
    console.log('✅ 设备信息已存储:', {
      device_no: device_info?.device_no,
      device_name: device_info?.device_name,
      customer_name: customer?.customer_name,
      customer_id: customer?.id,
      device_id: device_info?.id
    });
  } catch (error) {
    // 错误处理
  }
}
```

---

### 3. ✅ 登录时查询并存储完整数据

#### pages/login/login.js

**登录流程优化：**
```javascript
async checkDeviceBindingAndNavigate() {
  try {
    // 1. 获取用户绑定的设备列表
    const devicesResult = await API.getUserDevices();
    const devices = devicesResult.data.devices || [];
    
    if (devices.length > 0) {
      const deviceCode = devices[0].deviceCode;
      
      try {
        // 2. 查询完整的设备信息
        const deviceInfoResult = await API.getCustomerByDeviceCode(deviceCode);
        
        if (deviceInfoResult.success && deviceInfoResult.data) {
          const { customer, binding_info, device_info } = deviceInfoResult.data;
          
          // 3. 存储完整信息（不存储 deviceCode）
          wx.setStorageSync('deviceBound', true);
          wx.setStorageSync('device_no', device_info?.device_no || deviceCode);
          wx.setStorageSync('device_info', device_info);
          wx.setStorageSync('customer_info', customer);
          wx.setStorageSync('binding_info', binding_info);
          
          // 4. 同步到全局数据
          app.globalData.deviceBound = true;
          app.globalData.device_no = device_info?.device_no || deviceCode;
          app.globalData.device_info = device_info;
          app.globalData.customer_info = customer;
          app.globalData.binding_info = binding_info;
          
          console.log('✅ 设备信息已加载并存储');
        }
      } catch (error) {
        console.error('查询设备信息失败:', error);
        // 即使查询失败也继续登录流程
      }
      
      // 5. 跳转首页
      navigation.switchTab('/pages/home/home');
    }
  } catch (error) {
    // 错误处理
  }
}
```

---

## 数据结构对比

### 旧的数据结构（错误）
```javascript
// 缓存
{
  deviceBound: true,
  deviceCode: "DEV00845211"  // ❌ 错误的参数名
}

// 全局数据
{
  deviceBound: true,
  deviceCode: "DEV00845211"  // ❌ 错误的参数名
}
```

### 新的数据结构（正确）
```javascript
// 缓存
{
  deviceBound: true,
  device_no: "DEV00845211",  // ✅ 正确的设备编号
  device_info: {
    id: 16,
    device_no: "DEV00845211",
    device_name: "5G测试设备",
    device_type: "1",
    specification: "wifi6",
    amount: "99.00"
  },
  customer_info: {
    id: 37,
    customer_name: "高超",
    user_type: 1,
    id_number: "321023199111015012",
    contact_person: "刘柱",
    contact_phone: "18120052088",
    city: "江苏省/苏州市"
  },
  binding_info: {
    id: 11,
    device_id: 16,
    device_no: "DEV00845211",
    customer_id: 37,
    customer_name: "高超",
    deposit: "100.00",
    carrier: "电信",
    recharge_account: "18120052088",
    expire_time: "2026-02-17 19:41:48",
    current_package_id: 19,
    current_package_name: "测试包月卡--1天"
  }
}

// 全局数据
{
  deviceBound: true,
  device_no: "DEV00845211",
  device_info: { ... },
  customer_info: { ... },
  binding_info: { ... }
}
```

---

## 使用方式对比

### 旧的使用方式（错误）
```javascript
// ❌ 错误：使用 deviceCode
const device_no = wx.getStorageSync('deviceCode');
const app = getApp();
const deviceCode = app.globalData.deviceCode;
```

### 新的使用方式（正确）
```javascript
// ✅ 正确：使用 device_no
const device_no = wx.getStorageSync('device_no');
const app = getApp();
const device_no = app.globalData.device_no;

// ✅ 获取完整设备信息
const device_info = wx.getStorageSync('device_info');
const customer_info = wx.getStorageSync('customer_info');
const binding_info = wx.getStorageSync('binding_info');

// ✅ 从全局数据获取
const app = getApp();
const device_info = app.globalData.device_info;
const customer_info = app.globalData.customer_info;
```

---

## 迁移检查清单

### 已完成的修改 ✅

- [x] **app.js**
  - [x] 更新 `globalData` 定义
  - [x] 更新启动时恢复数据逻辑
  - [x] 添加旧缓存清理逻辑

- [x] **pages/bind-device-code/bind-device-code.js**
  - [x] 绑定前清除旧缓存（包括 `deviceCode`）
  - [x] 绑定成功后存储完整数据
  - [x] 移除 `deviceCode` 存储

- [x] **pages/login/login.js**
  - [x] 登录成功后查询完整设备信息
  - [x] 存储完整数据到缓存
  - [x] 移除 `deviceCode` 存储

### 需要检查的页面

所有使用设备信息的页面都应该使用 `device_no`：

- [ ] pages/pre-recharge/pre-recharge.js
- [ ] pages/package-order/package-order.js
- [ ] pages/my-bill/my-bill.js
- [ ] pages/service-evaluation/service-evaluation.js
- [ ] 其他使用设备信息的页面

**检查方式：**
```javascript
// 搜索这些模式
wx.getStorageSync('deviceCode')  // ❌ 应该改为 device_no
app.globalData.deviceCode        // ❌ 应该改为 device_no
```

---

## 存储的数据说明

### 1. device_no
- **类型**: String
- **来源**: `device_info.device_no`
- **用途**: 设备编号，用于API调用
- **示例**: `"DEV00845211"`

### 2. device_info
- **类型**: Object
- **来源**: API `/api/v1/customer-device-bindings/getCustomerByDeviceCode`
- **用途**: 设备详细信息
- **关键字段**:
  - `id`: 设备ID（用于订单创建）
  - `device_no`: 设备编号
  - `device_name`: 设备名称
  - `device_type`: 设备类型
  - `amount`: 设备金额

### 3. customer_info
- **类型**: Object
- **来源**: API `/api/v1/customer-device-bindings/getCustomerByDeviceCode`
- **用途**: 客户信息
- **关键字段**:
  - `id`: 客户ID（用于订单创建）
  - `customer_name`: 客户姓名
  - `contact_phone`: 联系电话
  - `city`: 所在城市

### 4. binding_info
- **类型**: Object
- **来源**: API `/api/v1/customer-device-bindings/getCustomerByDeviceCode`
- **用途**: 绑定关系信息
- **关键字段**:
  - `device_id`: 设备ID
  - `customer_id`: 客户ID
  - `carrier`: 运营商
  - `recharge_account`: 充值账号
  - `expire_time`: 到期时间
  - `current_package_name`: 当前套餐

---

## 测试验证

### 测试场景 1：新用户绑定
```
1. 新用户登录
2. 进入绑定页面
3. 输入设备码
4. 绑定成功
5. ✅ 检查缓存：应该有 device_no, device_info, customer_info, binding_info
6. ✅ 检查缓存：不应该有 deviceCode
7. ✅ 检查全局数据：应该有完整的设备信息
```

### 测试场景 2：老用户登录
```
1. 老用户登录（已绑定设备）
2. 登录成功
3. ✅ 检查缓存：应该有完整的设备信息
4. ✅ 检查缓存：不应该有 deviceCode
5. ✅ 检查全局数据：应该有完整的设备信息
6. 进入需要设备信息的页面
7. ✅ 页面能正确读取 device_no
```

### 测试场景 3：重新绑定
```
1. 已绑定用户
2. 进入"我的"页面
3. 点击"重新绑定设备"
4. 输入新设备码
5. 绑定成功
6. ✅ 检查缓存：旧设备信息已清除
7. ✅ 检查缓存：新设备信息已存储
8. ✅ 检查缓存：不应该有 deviceCode
```

### 测试场景 4：旧缓存清理
```
1. 手动添加旧的 deviceCode 缓存
2. 重启小程序
3. ✅ app.js 应该检测到并清除 deviceCode
4. ✅ 控制台应该有清除日志
```

---

## 调试命令

### 查看当前缓存
```javascript
console.log('deviceBound:', wx.getStorageSync('deviceBound'));
console.log('device_no:', wx.getStorageSync('device_no'));
console.log('device_info:', wx.getStorageSync('device_info'));
console.log('customer_info:', wx.getStorageSync('customer_info'));
console.log('binding_info:', wx.getStorageSync('binding_info'));
console.log('deviceCode (应该为空):', wx.getStorageSync('deviceCode'));
```

### 查看全局数据
```javascript
const app = getApp();
console.log('globalData:', {
  deviceBound: app.globalData.deviceBound,
  device_no: app.globalData.device_no,
  device_info: app.globalData.device_info,
  customer_info: app.globalData.customer_info,
  binding_info: app.globalData.binding_info
});
```

### 手动清除所有缓存
```javascript
wx.clearStorageSync();
console.log('所有缓存已清除');
```

---

## 更新日志

### v1.4.0 (2025-11-27 16:40)

**重大变更：**
- 🔄 完全移除 `deviceCode` 参数
- ✅ 使用 `device_no` 作为设备编号
- 📦 绑定/登录成功后存储完整设备信息

**新增：**
- ✅ 绑定成功后存储 `device_info`, `customer_info`, `binding_info`
- ✅ 登录成功后查询并存储完整设备信息
- ✅ 启动时自动清理旧的 `deviceCode` 缓存

**优化：**
- 🔄 统一使用 `device_no` 参数
- 🔄 完整的设备信息存储
- 🔄 更好的数据一致性

**修改文件：**
- `app.js` - 全局数据定义和启动逻辑
- `pages/bind-device-code/bind-device-code.js` - 绑定流程
- `pages/login/login.js` - 登录流程

---

## 常见问题

### Q: 为什么要移除 deviceCode？
A: `deviceCode` 是之前错误使用的参数名，正确的应该是 `device_no`。

### Q: 绑定成功后存储了哪些数据？
A: 存储了完整的设备信息：`device_no`, `device_info`, `customer_info`, `binding_info`。

### Q: 旧的 deviceCode 缓存会自动清理吗？
A: 是的，小程序启动时会自动检测并清理旧的 `deviceCode` 缓存。

### Q: 如何获取设备编号？
A: 使用 `wx.getStorageSync('device_no')` 或 `app.globalData.device_no`。

### Q: 如何获取客户ID和设备ID？
A: 
```javascript
const customer_info = wx.getStorageSync('customer_info');
const device_info = wx.getStorageSync('device_info');
const customer_id = customer_info?.id;
const device_id = device_info?.id;
```

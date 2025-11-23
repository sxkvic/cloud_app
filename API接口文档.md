# API接口文档

## 目录

1. [基础用户API](#基础用户api)
2. [管理员认证API](#管理员认证api)
3. [设备管理API](#设备管理api)
4. [客户管理API](#客户管理api)
5. [订单管理API](#订单管理api)
6. [客户设备绑定API](#客户设备绑定api)
7. [文件管理API](#文件管理api)
8. [邮件服务API](#邮件服务api)
9. [支付相关API](#支付相关api)
10. [工具相关API](#工具相关api)
11. [发票管理API](#发票管理api)
12. [套餐管理API](#套餐管理api)
13. [账单管理API](#账单管理api)
14. [统一响应格式](#统一响应格式)

## 基础用户API

### 1.1 通过微信code获取openid

**路径**: `/api/getOpenidByCode`
**方法**: `POST`
**描述**: 通过微信小程序code获取用户openid
**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `code` | `string` | 是 | 微信小程序登录code |

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取openid成功",
  "data": {
    "openid": "oXxxxxxx"
  }
}
```

### 1.2 通过openid生成JWT token

**路径**: `/api/generateTokenByOpenid`
**方法**: `POST`
**描述**: 通过openid生成用户访问token
**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `openid` | `string` | 是 | 用户openid |

**成功响应示例**:
```json
{
  "success": true,
  "message": "生成token成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200
  }
}
```

### 1.3 通过token获取用户信息

**路径**: `/api/getUserInfo`
**方法**: `GET`
**描述**: 获取当前登录用户的信息
**请求头**:
- `Authorization`: Bearer token

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": "user123",
    "openid": "oXxxxxxx",
    "nickname": "用户昵称",
    "avatar": "头像URL"
  }
}
```

### 1.4 创建用户并生成token

**路径**: `/api/createUser`
**方法**: `POST`
**描述**: 创建新用户并生成访问token
**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `openid` | `string` | 是 | 用户openid |
| `nickname` | `string` | 否 | 用户昵称 |
| `avatar` | `string` | 否 | 头像URL |

**成功响应示例**:
```json
{
  "success": true,
  "message": "用户创建成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": "user123",
      "openid": "oXxxxxxx"
    }
  }
}
```

### 1.5 获取用户绑定的设备列表

**路径**: `/api/getUserDevices`
**方法**: `GET`
**描述**: 获取当前用户绑定的设备列表
**请求头**:
- `Authorization`: Bearer token

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取设备列表成功",
  "data": {
    "devices": [
      {
        "id": "dev123",
        "deviceCode": "DEV001",
        "name": "设备名称"
      }
    ]
  }
}
```

### 1.6 绑定设备到用户

**路径**: `/api/bindDevice`
**方法**: `POST`
**描述**: 将设备绑定到当前登录用户
**请求头**:
- `Authorization`: Bearer token

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `deviceCode` | `string` | 是 | 设备码 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "设备绑定成功",
  "data": {
    "bindingId": "bind123"
  }
}
```

### 1.7 解绑设备

**路径**: `/api/unbindDevice`
**方法**: `POST`
**描述**: 解除当前用户与设备的绑定关系
**请求头**:
- `Authorization`: Bearer token

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `deviceCode` | `string` | 是 | 设备码 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "设备解绑成功",
  "data": null
}
```

### 1.8 获取所有小程序用户列表

**路径**: `/api/getAllWxUsers`
**方法**: `GET`
**描述**: 获取系统中所有微信小程序用户（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取用户列表成功",
  "data": {
    "users": [
      {
        "id": "user123",
        "openid": "oXxxxxxx",
        "nickname": "用户昵称",
        "createTime": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 100
  }
}
```

## 管理员认证API

### 2.1 管理员登录

**路径**: `/api/admin/login`
**方法**: `POST`
**描述**: 管理员账户登录
**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `username` | `string` | 是 | 用户名 |
| `password` | `string` | 是 | 密码 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "adminInfo": {
      "id": "admin123",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### 2.2 管理员登出

**路径**: `/api/admin/logout`
**方法**: `POST`
**描述**: 管理员退出登录
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "登出成功",
  "data": null
}
```

### 2.3 获取管理员信息

**路径**: `/api/admin/getWebUserInfo`
**方法**: `GET`
**描述**: 获取当前登录管理员的信息
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取管理员信息成功",
  "data": {
    "id": "admin123",
    "username": "admin",
    "realName": "管理员姓名",
    "role": "admin"
  }
}
```

### 2.4 修改密码

**路径**: `/api/admin/change-password`
**方法**: `POST`
**描述**: 修改管理员密码
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `oldPassword` | `string` | 是 | 旧密码 |
| `newPassword` | `string` | 是 | 新密码 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "密码修改成功",
  "data": null
}
```

### 2.5 更新管理员信息

**路径**: `/api/admin/updateWebUser`
**方法**: `PUT`
**描述**: 更新管理员个人信息
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `realName` | `string` | 否 | 真实姓名 |
| `phone` | `string` | 否 | 手机号码 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "信息更新成功",
  "data": {
    "id": "admin123",
    "realName": "新姓名",
    "phone": "13800138000"
  }
}
```

### 2.6 创建管理员账户

**路径**: `/api/admin/create-account`
**方法**: `POST`
**描述**: 创建新的管理员账户
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `username` | `string` | 是 | 用户名 |
| `password` | `string` | 是 | 密码 |
| `realName` | `string` | 否 | 真实姓名 |
| `role` | `string` | 否 | 角色 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "账户创建成功",
  "data": {
    "id": "admin456",
    "username": "newadmin"
  }
}
```

### 2.7 获取管理员列表

**路径**: `/api/admin/getWebUserList`
**方法**: `GET`
**描述**: 获取所有管理员账户列表
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取列表成功",
  "data": {
    "admins": [
      {
        "id": "admin123",
        "username": "admin",
        "realName": "管理员",
        "role": "admin",
        "createTime": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 5
  }
}
```

### 2.8 删除管理员账户

**路径**: `/api/admin/delete-account`
**方法**: `POST`
**描述**: 删除指定的管理员账户
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `adminId` | `string` | 是 | 管理员ID |

**成功响应示例**:
```json
{
  "success": true,
  "message": "账户删除成功",
  "data": null
}
```

## 设备管理API

### 3.1 创建设备

**路径**: `/api/createDevice`
**方法**: `POST`
**描述**: 创建新设备（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `deviceCode` | `string` | 是 | 设备码 |
| `name` | `string` | 是 | 设备名称 |
| `type` | `string` | 否 | 设备类型 |
| `status` | `string` | 否 | 设备状态 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "设备创建成功",
  "data": {
    "id": "dev123",
    "deviceCode": "DEV001",
    "name": "测试设备"
  }
}
```

### 3.2 获取设备列表

**路径**: `/api/getDevicesList`
**方法**: `GET`
**描述**: 获取所有设备列表（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取设备列表成功",
  "data": {
    "devices": [
      {
        "id": "dev123",
        "deviceCode": "DEV001",
        "name": "测试设备",
        "status": "active"
      }
    ],
    "total": 20
  }
}
```

### 3.3 获取设备详情

**路径**: `/api/getDeviceDetail/:id`
**方法**: `GET`
**描述**: 获取指定设备的详细信息（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: 设备ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取设备详情成功",
  "data": {
    "id": "dev123",
    "deviceCode": "DEV001",
    "name": "测试设备",
    "type": "type1",
    "status": "active",
    "createTime": "2024-01-01T12:00:00Z"
  }
}
```

### 3.4 更新设备信息

**路径**: `/api/updateDevice/:id`
**方法**: `PUT`
**描述**: 更新指定设备的信息（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: 设备ID

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `name` | `string` | 否 | 设备名称 |
| `type` | `string` | 否 | 设备类型 |
| `status` | `string` | 否 | 设备状态 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "设备更新成功",
  "data": {
    "id": "dev123",
    "name": "更新后的设备名",
    "status": "inactive"
  }
}
```

### 3.5 删除设备

**路径**: `/api/deleteDevice/:id`
**方法**: `DELETE`
**描述**: 删除指定设备（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: 设备ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "设备删除成功",
  "data": null
}
```

## 客户管理API

### 4.1 创建客户

**路径**: `/api/createCustomer`
**方法**: `POST`
**描述**: 创建新客户（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `name` | `string` | 是 | 客户名称 |
| `contact` | `string` | 否 | 联系人 |
| `phone` | `string` | 否 | 联系电话 |
| `address` | `string` | 否 | 地址 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "客户创建成功",
  "data": {
    "id": "cust123",
    "name": "测试客户"
  }
}
```

### 4.2 获取客户列表

**路径**: `/api/getCustomerLists`
**方法**: `GET`
**描述**: 获取所有客户列表（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取客户列表成功",
  "data": {
    "customers": [
      {
        "id": "cust123",
        "name": "测试客户",
        "contact": "张三",
        "phone": "13800138000"
      }
    ],
    "total": 50
  }
}
```

### 4.3 获取客户详情

**路径**: `/api/getCustomerDetail/:id`
**方法**: `GET`
**描述**: 获取指定客户的详细信息（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: 客户ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取客户详情成功",
  "data": {
    "id": "cust123",
    "name": "测试客户",
    "contact": "张三",
    "phone": "13800138000",
    "address": "北京市朝阳区",
    "createTime": "2024-01-01T12:00:00Z"
  }
}
```

### 4.4 更新客户信息

**路径**: `/api/updateCustomer/:id`
**方法**: `PUT`
**描述**: 更新指定客户的信息（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: 客户ID

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `name` | `string` | 否 | 客户名称 |
| `contact` | `string` | 否 | 联系人 |
| `phone` | `string` | 否 | 联系电话 |
| `address` | `string` | 否 | 地址 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "客户信息更新成功",
  "data": {
    "id": "cust123",
    "name": "更新后的客户名称",
    "phone": "13900139000"
  }
}
```

### 4.5 删除客户

**路径**: `/api/deleteCustomer/:id`
**方法**: `DELETE`
**描述**: 删除指定客户（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: 客户ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "客户删除成功",
  "data": null
}
```

## 订单管理API

### 5.1 新增订单

**路径**: `/api/orders`
**方法**: `POST`
**描述**: 创建新订单（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `customerId` | `string` | 是 | 客户ID |
| `amount` | `number` | 是 | 订单金额 |
| `products` | `array` | 否 | 产品列表 |
| `remark` | `string` | 否 | 备注 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "订单创建成功",
  "data": {
    "orderId": "ORD123456789",
    "status": "PENDING"
  }
}
```

### 5.2 查询订单列表

**路径**: `/api/orders`
**方法**: `GET`
**描述**: 查询订单列表，支持分页和多条件筛选（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `page` | `number` | 否 | 页码，默认1 |
| `pageSize` | `number` | 否 | 每页数量，默认10 |
| `device_no` | `string` | 否 | 设备码搜索（支持模糊匹配） |
| `customer_name` | `string` | 否 | 客户名称搜索（支持模糊匹配） |
| `review_status` | `number` | 否 | 审核状态筛选（1：未审核，2：已审核） |
| `payment_status` | `number` | 否 | 支付状态筛选（1：未支付，2：已支付） |

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取订单列表成功",
  "data": {
    "orders": [
      {
        "order_no": "ORD20240101123456",
        "device_no": "DEV123456",
        "customer_name": "测试客户",
        "package_name": "基础套餐",
        "package_type": "monthly",
        "order_amount": 1999.99,    
        "payment_status": 2,
        "payment_type": 1,
        "order_status": 1,
        "order_time": "2024-01-01T12:00:00Z",
        "payment_time": "2024-01-01T12:30:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

### 5.3 修改订单支付状态

**路径**: `/api/orders/payment-status`
**方法**: `PUT`
**描述**: 更新订单的支付状态（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `orderId` | `string` | 是 | 订单ID |
| `paymentStatus` | `string` | 是 | 支付状态 |
| `paymentMethod` | `string` | 否 | 支付方式 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "支付状态更新成功",
  "data": {
    "orderId": "ORD123456789",
    "paymentStatus": "PAID"
  }
}
```

### 5.4 获取订单详情

**路径**: `/api/orders/:id`
**方法**: `GET`
**描述**: 获取订单详情，包含客户信息（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: 订单ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取订单详情成功",
  "data": {
    "id": "ORD123456789",
    "customerId": "cust123",
    "customerName": "测试客户",
    "amount": 1999.99,
    "status": "PAID",
    "paymentMethod": "wechat",
    "createTime": "2024-01-01T12:00:00Z",
    "payTime": "2024-01-01T12:30:00Z"
  }
}
```

### 5.5 删除订单

**路径**: `/api/orders/:id`
**方法**: `DELETE`
**描述**: 删除订单（软删除，移至备份表）（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: 订单ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "订单删除成功",
  "data": null
}
```

### 5.6 更新订单审核状态

**路径**: `/api/orders/:id/review`
**方法**: `PUT`
**描述**: 更新订单的审核状态（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: 订单ID

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `reviewStatus` | `string` | 是 | 审核状态 |
| `reviewRemark` | `string` | 否 | 审核备注 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "审核状态更新成功",
  "data": {
    "orderId": "ORD123456789",
    "reviewStatus": "APPROVED"
  }
}
```

## 客户设备绑定API

### 6.1 创建客户设备绑定

**路径**: `/api/createBinding`
**方法**: `POST`
**描述**: 创建客户与设备的绑定关系
**请求头**:
- `Authorization`: Bearer token (认证已集成)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `customer_id` | `string` | 是 | 客户ID |
| `device_id` | `string` | 是 | 设备ID |
| `binding_date` | `string` | 否 | 绑定日期 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "绑定成功",
  "data": {
    "id": "bind123",
    "customer_id": "cust123",
    "device_id": "dev123"
  }
}
```

### 6.2 获取客户设备绑定列表

**路径**: `/api/getBindingsList`
**方法**: `GET`
**描述**: 获取所有客户设备绑定列表，支持分页和搜索

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `page` | `number` | 否 | 页码 |
| `pageSize` | `number` | 否 | 每页数量 |
| `keyword` | `string` | 否 | 搜索关键词 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取绑定列表成功",
  "data": {
    "bindings": [
      {
        "id": "bind123",
        "customer_id": "cust123",
        "device_id": "dev123",
        "binding_date": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 20
  }
}
```

### 6.3 根据客户ID获取设备绑定列表

**路径**: `/api/getBindingsByCustomer/:customer_id`
**方法**: `GET`
**描述**: 获取指定客户的所有设备绑定

**路径参数**:
- `customer_id`: 客户ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取客户设备绑定成功",
  "data": {
    "bindings": [
      {
        "id": "bind123",
        "device_id": "dev123",
        "device_name": "测试设备",
        "binding_date": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

### 6.4 检查设备是否已被绑定

**路径**: `/api/checkDeviceBinding/:device_id`
**方法**: `GET`
**描述**: 检查指定设备是否已被绑定

**路径参数**:
- `device_id`: 设备ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "检查成功",
  "data": {
    "is_bound": true,
    "customer_id": "cust123",
    "binding_date": "2024-01-01T12:00:00Z"
  }
}
```

### 6.5 获取绑定关系详情

**路径**: `/api/getBindingDetail/:id`
**方法**: `GET`
**描述**: 获取指定绑定关系的详细信息

**路径参数**:
- `id`: 绑定关系ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取详情成功",
  "data": {
    "id": "bind123",
    "customer_id": "cust123",
    "customer_name": "测试客户",
    "device_id": "dev123",
    "device_name": "测试设备",
    "binding_date": "2024-01-01T12:00:00Z"
  }
}
```

### 6.6 更新客户设备绑定

**路径**: `/api/updateBinding/:id`
**方法**: `PUT`
**描述**: 更新客户设备绑定信息
**请求头**:
- `Authorization`: Bearer token (认证已集成)

**路径参数**:
- `id`: 绑定关系ID

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `binding_date` | `string` | 否 | 绑定日期 |
| `remark` | `string` | 否 | 备注信息 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "更新成功",
  "data": {
    "id": "bind123",
    "binding_date": "2024-01-02T12:00:00Z"
  }
}
```

### 6.7 解除客户设备绑定

**路径**: `/api/deleteBinding/:id`
**方法**: `DELETE`
**描述**: 解除客户与设备的绑定关系
**请求头**:
- `Authorization`: Bearer token (认证已集成)

**路径参数**:
- `id`: 绑定关系ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "解绑成功",
  "data": null
}
```

### 6.8 根据设备码查询绑定的客户信息

**路径**: `/api/getCustomerByDeviceCode/:device_code`
**方法**: `GET`
**描述**: 根据设备码查询绑定的客户信息

**路径参数**:
- `device_code`: 设备码

**成功响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "customer_id": "cust123",
    "customer_name": "测试客户",
    "contact": "张三",
    "phone": "13800138000"
  }
}
```

## 文件管理API

### 7.1 上传文件

**路径**: `/api/upload`
**方法**: `POST`
**描述**: 上传单个文件（管理员权限）
**请求头**:
- `Authorization`: Bearer token (管理员)
- `Content-Type`: multipart/form-data

**请求体**: 表单数据，包含文件字段

**成功响应示例**:
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "fileId": "file123",
    "fileName": "test.jpg",
    "fileUrl": "/api/download/file123",
    "fileSize": 10240,
    "uploadTime": "2024-01-01T12:00:00Z"
  }
}
```

### 7.2 下载文件

**路径**: `/api/download/:fileId`
**方法**: `GET`
**描述**: 下载指定文件（公开访问，支持前端img标签直接展示图片）

**路径参数**:
- `fileId`: 文件ID

**响应**: 文件二进制数据

### 7.3 获取文件列表

**路径**: `/api/list`
**方法**: `GET`
**描述**: 获取文件列表（需要用户认证）
**请求头**:
- `Authorization`: Bearer token

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取文件列表成功",
  "data": {
    "files": [
      {
        "fileId": "file123",
        "fileName": "test.jpg",
        "fileSize": 10240,
        "uploadTime": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 10
  }
}
```

### 7.4 删除文件

**路径**: `/api/:fileId`
**方法**: `DELETE`
**描述**: 删除指定文件（管理员权限）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `fileId`: 文件ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "文件删除成功",
  "data": null
}
```

## 邮件服务API

### 8.1 发送带附件的邮件

**路径**: `/api/email/send-attachment`
**方法**: `POST`
**描述**: 发送包含附件的邮件（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `to` | `string` | 是 | 收件人邮箱 |
| `subject` | `string` | 是 | 邮件主题 |
| `content` | `string` | 是 | 邮件内容 |
| `attachmentUrl` | `string` | 否 | 附件URL |

**成功响应示例**:
```json
{
  "success": true,
  "message": "邮件发送成功",
  "data": {
    "messageId": "msg123",
    "to": "recipient@example.com",
    "subject": "测试邮件"
  }
}
```

### 8.2 测试邮件配置

**路径**: `/api/email/test-config`
**方法**: `GET`
**描述**: 测试邮件服务器配置是否正确（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "邮件配置测试成功",
  "data": {
    "smtpServer": "smtp.example.com",
    "port": 465,
    "secure": true,
    "connectionTime": 125
  }
}
```

## 支付相关API

### 9.1 生成支付二维码

**路径**: `/api/payments/qrcode`
**方法**: `POST`
**描述**: 生成支付二维码（需要用户登录）
**请求头**:
- `Authorization`: Bearer token

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `orderId` | `string` | 是 | 订单ID |
| `amount` | `number` | 是 | 支付金额 |
| `type` | `string` | 是 | 支付类型 (wechat/alipay) |
| `description` | `string` | 否 | 订单描述 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "二维码生成成功",
  "data": {
    "qrcodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=weixin://wxpay/bizpayurl?pr=abcdefg",
    "outTradeNo": "WX123456789012345",
    "expireTime": "2024-01-01T12:00:00Z"
  }
}
```

### 9.2 查询支付状态

**路径**: `/api/payments/status`
**方法**: `GET`
**描述**: 查询支付状态（需要用户登录）
**请求头**:
- `Authorization`: Bearer token

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `orderId` | `string` | 是 | 订单ID |
| `outTradeNo` | `string` | 否 | 外部交易号 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "查询成功",
  "data": {
    "orderId": "ORD123456789",
    "status": "SUCCESS",
    "payTime": "2024-01-01T11:30:45Z",
    "amount": 99.99,
    "paymentMethod": "wechat"
  }
}
```

### 9.3 取消支付

**路径**: `/api/payments/cancel`
**方法**: `POST`
**描述**: 取消支付（需要用户登录）
**请求头**:
- `Authorization`: Bearer token

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `orderId` | `string` | 是 | 订单ID |
| `outTradeNo` | `string` | 否 | 外部交易号 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "支付已取消",
  "data": {
    "orderId": "ORD123456789",
    "status": "CANCELLED"
  }
}
```

### 9.4 微信支付回调

**路径**: `/api/payments/wechat-notify`
**方法**: `POST`
**描述**: 微信支付异步通知回调（无需认证，面向微信服务器）

**请求体**: XML格式的通知数据

**响应**: XML格式的响应

### 9.5 支付宝支付异步回调

**路径**: `/api/payments/alipay-notify`
**方法**: `POST`
**描述**: 支付宝支付异步通知回调（无需认证，面向支付宝服务器）

**请求体**: 表单数据格式的通知数据

**响应**: 字符串 "success" 或 "fail"

### 9.6 支付宝支付同步回调

**路径**: `/api/payments/alipay-return`
**方法**: `GET`
**描述**: 支付宝支付同步通知回调（无需认证，面向用户浏览器）

**查询参数**: 支付宝返回的参数

**响应**: 跳转或页面提示

### 9.7 管理员生成支付二维码

**路径**: `/api/admin/payments/qrcode`
**方法**: `POST`
**描述**: 管理员生成支付二维码（需要管理员权限）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**: 同用户端生成支付二维码

### 9.8 管理员查询支付状态

**路径**: `/api/admin/payments/status`
**方法**: `GET`
**描述**: 管理员查询支付状态（需要管理员权限）
**请求头**:
- `Authorization`: Bearer token (管理员)

**查询参数**: 同用户端查询支付状态

### 9.9 管理员取消支付

**路径**: `/api/admin/payments/cancel`
**方法**: `POST`
**描述**: 管理员取消支付（需要管理员权限）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**: 同用户端取消支付

## 工具相关API

### 10.1 获取中国所有省份和自治区列表

**路径**: `/api/v1/tools/provinces`
**方法**: `GET`
**描述**: 获取中国所有省份和自治区的列表

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取省份列表成功",
  "data": {
    "provinces": [
      { "id": "11", "name": "北京市", "code": "110000" },
      { "id": "12", "name": "天津市", "code": "120000" },
      { "id": "13", "name": "河北省", "code": "130000" }
      // ... 更多省份
    ]
  }
}
```

### 10.2 根据省份ID获取城市列表

**路径**: `/api/v1/tools/provinces/:provinceId/cities`
**方法**: `GET`
**描述**: 根据省份ID获取该省份下的所有城市列表

**路径参数**:
- `provinceId`: 省份ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取城市列表成功",
  "data": {
    "cities": [
      { "id": "110100", "name": "北京市", "code": "110100" }
    ]
  }
}
```

### 10.3 获取客户统计信息

**路径**: `/api/v1/tools/stats/customers`
**方法**: `GET`
**描述**: 获取客户总数和设备绑定数量统计（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取客户统计信息成功",
  "data": {
    "total_customers": 150,
    "total_bound_devices": 320
  }
}
```

### 10.4 获取系统操作日志

**路径**: `/api/v1/tools/operation-logs`
**方法**: `GET`
**描述**: 获取系统操作日志列表（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**查询参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `page` | `number` | 否 | 页码，默认1 |
| `pageSize` | `number` | 否 | 每页数量，默认10 |
| `keyword` | `string` | 否 | 搜索关键词 |
| `startDate` | `string` | 否 | 开始日期（YYYY-MM-DD） |
| `endDate` | `string` | 否 | 结束日期（YYYY-MM-DD） |

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取操作日志成功",
  "data": {
    "logs": [
      {
        "id": "log123",
        "userId": "admin123",
        "action": "login",
        "ip": "192.168.1.1",
        "createTime": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 10.5 Banner管理

#### 10.5.1 创建Banner

**路径**: `/api/v1/tools/createBanner`
**方法**: `POST`
**描述**: 创建新的Banner（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)
- `Content-Type`: multipart/form-data

**请求体**: 表单数据，包含图片文件和其他字段

**成功响应示例**:
```json
{
  "success": true,
  "message": "Banner创建成功",
  "data": {
    "id": "banner123",
    "imageUrl": "/api/download/banner.jpg",
    "title": "首页Banner",
    "link": "https://example.com"
  }
}
```

#### 10.5.2 获取Banner列表

**路径**: `/api/v1/tools/getBannersList`
**方法**: `GET`
**描述**: 获取Banner列表（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取Banner列表成功",
  "data": {
    "banners": [
      {
        "id": "banner123",
        "imageUrl": "/api/download/banner.jpg",
        "title": "首页Banner",
        "status": "active",
        "createTime": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 5
  }
}
```

#### 10.5.3 删除Banner

**路径**: `/api/v1/tools/deleteBanner/:id`
**方法**: `DELETE`
**描述**: 删除指定的Banner（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: Banner ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "Banner删除成功",
  "data": null
}
```

#### 10.5.4 更新Banner状态

**路径**: `/api/v1/tools/updateBannerStatus/:id/status`
**方法**: `PUT`
**描述**: 更新Banner的状态（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
- `id`: Banner ID

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `status` | `string` | 是 | 状态（active/inactive） |

**成功响应示例**:
```json
{
  "success": true,
  "message": "状态更新成功",
  "data": {
    "id": "banner123",
    "status": "active"
  }
}
```

### 10.6 公众号推文管理

#### 10.6.1 创建推文

**路径**: `/api/v1/tools/createArticle`
**方法**: `POST`
**描述**: 创建公众号推文（管理员）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `title` | `string` | 是 | 标题 |
| `content` | `string` | 是 | 内容 |
| `cover` | `string` | 否 | 封面图URL |
| `author` | `string` | 否 | 作者 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "推文创建成功",
  "data": {
    "id": "article123",
    "title": "测试推文",
    "publishTime": "2024-01-01T12:00:00Z"
  }
}
```

#### 10.6.2 获取推文列表

**路径**: `/api/v1/tools/getArticlesList`
**方法**: `GET`
**描述**: 获取推文列表

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取推文列表成功",
  "data": {
    "articles": [
      {
        "id": "article123",
        "title": "测试推文",
        "cover": "/api/download/cover.jpg",
        "publishTime": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 20
  }
}
```

#### 10.6.3 获取推文详情

**路径**: `/api/v1/tools/getArticleDetail/:id`
**方法**: `GET`
**描述**: 获取推文详情

**路径参数**:
- `id`: 推文ID

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取推文详情成功",
  "data": {
    "id": "article123",
    "title": "测试推文",
    "content": "推文内容...",
    "author": "管理员",
    "publishTime": "2024-01-01T12:00:00Z"
  }
}
```
## 套餐管理API

### 12.1 新增套餐

**路径**: `/api/packages/addPackage`
**方法**: `POST`
**描述**: 新增套餐（需要管理员权限）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `name` | `string` | 是 | 套餐名称 |
| `description` | `string` | 否 | 套餐描述 |
| `price` | `number` | 是 | 套餐价格 |
| `duration` | `number` | 否 | 有效期（天数） |
| `features` | `array` | 否 | 套餐特性列表 |
| `status` | `string` | 否 | 套餐状态 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "套餐添加成功",
  "data": {
    "packageId": "package123"
  }
}
```

### 12.2 获取套餐列表

**路径**: `/api/packages/getPackagesList`
**方法**: `GET`
**描述**: 获取套餐列表（支持分页和筛选）

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `page` | `number` | 否 | 页码 |
| `pageSize` | `number` | 否 | 每页数量 |
| `name` | `string` | 否 | 套餐名称（搜索） |
| `status` | `string` | 否 | 套餐状态（筛选） |

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取套餐列表成功",
  "data": {
    "packages": [
      {
        "id": "package123",
        "name": "标准套餐",
        "description": "标准服务套餐",
        "price": 1000,
        "duration": 30,
        "status": "active",
        "createTime": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 10
  }
}
```

### 12.3 获取套餐详情

**路径**: `/api/packages/getPackageDetail/:id`
**方法**: `GET`
**描述**: 获取套餐详情

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取套餐详情成功",
  "data": {
    "id": "package123",
    "name": "标准套餐",
    "description": "标准服务套餐",
    "price": 1000,
    "duration": 30,
    "features": ["功能1", "功能2"],
    "status": "active",
    "createTime": "2024-01-01T12:00:00Z"
  }
}
```

### 12.4 更新套餐

**路径**: `/api/packages/updatePackage/:id`
**方法**: `PUT`
**描述**: 更新套餐（需要管理员权限）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `name` | `string` | 否 | 套餐名称 |
| `description` | `string` | 否 | 套餐描述 |
| `price` | `number` | 否 | 套餐价格 |
| `duration` | `number` | 否 | 有效期（天数） |
| `features` | `array` | 否 | 套餐特性列表 |
| `status` | `string` | 否 | 套餐状态 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "套餐更新成功",
  "data": {
    "id": "package123",
    "name": "高级套餐",
    "price": 1500,
    "status": "active"
  }
}
```

### 12.5 删除套餐

**路径**: `/api/packages/deletePackage/:id`
**方法**: `DELETE`
**描述**: 删除套餐（需要管理员权限）
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "套餐删除成功",
  "data": null
}
```

## 账单管理API

### 13.1 初始化账单表

**路径**: `/api/customerBill/initTable`
**方法**: `POST`
**描述**: 初始化账单表（需要管理员权限）
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "账单表初始化成功",
  "data": null
}
```

### 13.2 获取账单列表

**路径**: `/api/customerBill/getCustomerBillList`
**方法**: `GET`
**描述**: 获取账单列表（支持分页和筛选）
**请求头**:
- `Authorization`: Bearer token

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `page` | `number` | 否 | 页码 |
| `pageSize` | `number` | 否 | 每页数量 |
| `customerId` | `string` | 否 | 客户ID |
| `startDate` | `string` | 否 | 开始日期 |
| `endDate` | `string` | 否 | 结束日期 |
| `status` | `string` | 否 | 账单状态 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取账单列表成功",
  "data": {
    "bills": [
      {
        "id": "bill123",
        "customerId": "cust456",
        "amount": 1000,
        "status": "unpaid",
        "dueDate": "2024-02-01T12:00:00Z",
        "createTime": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 20
  }
}
```

### 13.3 获取账单详情

**路径**: `/api/customerBill/getCustomerBillDetail/:id`
**方法**: `GET`
**描述**: 获取账单详情
**请求头**:
- `Authorization`: Bearer token

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取账单详情成功",
  "data": {
    "id": "bill123",
    "customerId": "cust456",
    "customerName": "张三",
    "amount": 1000,
    "status": "unpaid",
    "dueDate": "2024-02-01T12:00:00Z",
    "details": [
      {
        "item": "服务费",
        "quantity": 1,
        "price": 1000
      }
    ],
    "createTime": "2024-01-01T12:00:00Z"
  }
}
```

### 13.4 更新账单状态

**路径**: `/api/customerBill/updateBillStatus/:id`
**方法**: `PUT`
**描述**: 更新账单状态（需要管理员权限）
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `status` | `string` | 是 | 账单状态 |
| `paymentTime` | `string` | 否 | 支付时间 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "账单状态更新成功",
  "data": {
    "id": "bill123",
    "status": "paid",
    "paymentTime": "2024-01-15T12:00:00Z"
  }
}
```

### 13.5 导出账单PDF

**路径**: `/api/customerBill/exportBillPDF/:id`
**方法**: `GET`
**描述**: 导出账单PDF文件
**请求头**:
- `Authorization`: Bearer token

**成功响应**:
返回PDF文件流

### 13.6 发送账单邮件

**路径**: `/api/customerBill/sendBillEmail/:id`
**方法**: `POST`
**描述**: 发送账单邮件给客户
**请求头**:
- `Authorization`: Bearer token

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `email` | `string` | 是 | 接收邮件地址 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "账单邮件发送成功",
  "data": {
    "billId": "bill123",
    "email": "customer@example.com"
  }
}
```

### 14.1 初始化发票表和开票信息表

**路径**: `/api/v1/invoices/initialize`
**方法**: `POST`
**描述**: 初始化发票表和开票信息表
**请求头**:
- `Authorization`: Bearer token (管理员)

**成功响应示例**:
```json
{
  "success": true,
  "message": "发票表和开票信息表初始化成功"
}
```

### 14.2 为订单创建发票

**路径**: `/api/v1/invoices/create/:id`
**方法**: `POST`
**描述**: 为指定订单创建发票
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `number` | 是 | 订单ID |

**请求体参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `invoice_title` | `string` | 是 | 发票抬头 |
| `taxpayer_id` | `string` | 否 | 纳税人识别号 |
| `address` | `string` | 否 | 地址 |
| `phone` | `string` | 否 | 电话 |
| `bank_name` | `string` | 否 | 开户行 |
| `bank_account` | `string` | 否 | 银行账号 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "发票创建成功"
}
```

### 14.3 获取订单的发票信息

**路径**: `/api/v1/invoices/order/:id`
**方法**: `GET`
**描述**: 获取指定订单的发票信息
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `number` | 是 | 订单ID |

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取发票信息成功",
  "data": {
    "id": 1,
    "order_id": 1001,
    "invoice_title": "测试公司",
    "taxpayer_id": "91110105MA00000000",
    "address": "北京市朝阳区",
    "phone": "010-12345678",
    "bank_name": "中国工商银行",
    "bank_account": "6222020000000000000",
    "created_at": "2024-01-15 10:30:00"
  }
}
```

### 14.4 获取发票列表

**路径**: `/api/v1/invoices/getInvoiceList`
**方法**: `GET`
**描述**: 获取发票列表，支持分页和多条件筛选，数据来源于已支付且已审核的订单列表
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | 否 | 1 | 页码 |
| `limit` | `number` | 否 | 10 | 每页数量（1-100） |
| `customer_name` | `string` | 否 | 空字符串 | 客户名称（模糊匹配） |
| `device_no` | `string` | 否 | 空字符串 | 设备号（模糊匹配） |
| `invoice_status` | `number` | 否 | 空字符串 | 开票状态（1：未开票，2：已开票） |

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": 1,
        "order_no": "20240115000001",
        "order_time": "2024-01-15 10:30:00",
        "customer_id": 101,
        "customer_name": "测试客户",
        "device_id": 201,
        "device_no": "DEV001",
        "package_name": "标准套餐",
        "package_type": "yearly",
        "order_amount": 1999.00,
        "payment_type": 3,
        "invoice_status": 1,
        "invoice_status_text": "未开票",
        "remark": "测试订单",
        "created_at": "2024-01-15 10:30:00",
        "updated_at": "2024-01-15 11:00:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 10,
      "total": 1,
      "total_pages": 1
    }
  }
}

**失败响应示例**:
```json
{
  "success": false,
  "error": "参数错误",
  "details": "页码和每页数量必须是有效的数字，且页码不能小于1，每页数量不能小于1且不能大于100"
}

```

### 14.5 创建或更新开票信息

**路径**: `/api/v1/invoices/invoice-info/createOrUpdateInvoiceInfo`
**方法**: `POST`
**描述**: 创建或更新开票信息
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求体参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `device_no` | `string` | 否 | 设备号 |
| `customer_id` | `number` | 否 | 客户ID |
| `customer_name` | `string` | 是 | 客户名称 |
| `invoice_title` | `string` | 是 | 发票抬头 |
| `invoice_type` | `number` | 否 | 发票类型（1：增值税普票，2：增值税专票） |
| `taxpayer_id` | `string` | 否 | 纳税人识别号 |
| `address` | `string` | 否 | 地址 |
| `phone` | `string` | 否 | 电话 |
| `bank_name` | `string` | 否 | 开户行 |
| `bank_account` | `string` | 否 | 银行账号 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "开票信息创建成功",
  "data": {
    "id": 1,
    "device_no": "DEV001",
    "customer_id": 101,
    "customer_name": "测试客户",
    "invoice_title": "测试公司",
    "invoice_type": 1,
    "taxpayer_id": "91110105MA00000000",
    "address": "北京市朝阳区",
    "phone": "010-12345678",
    "bank_name": "中国工商银行",
    "bank_account": "6222020000000000000",
    "created_at": "2024-01-15 10:30:00",
    "updated_at": "2024-01-15 10:30:00"
  }
}
```

**失败响应示例**:
```json
{
  "success": false,
  "error": "参数错误",
  "details": "客户名称不能为空"
}
```
### 14.6 根据设备号获取开票信息

**路径**: `/api/v1/invoices/invoice-info/device/:device_no`
**方法**: `GET`
**描述**: 根据设备号获取开票信息
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `device_no` | `string` | 是 | 设备号 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取开票信息成功",
  "data": {
    "id": 1,
    "device_no": "DEV001",
    "customer_id": 101,
    "customer_name": "测试客户",
    "invoice_title": "测试公司",
    "invoice_type": 1,
    "invoice_type_text": "增值税普票",
    "taxpayer_id": "91110105MA00000000",
    "address": "北京市朝阳区",
    "phone": "010-12345678",
    "bank_name": "中国工商银行",
    "bank_account": "6222020000000000000",
    "created_at": "2024-01-15 10:30:00",
    "updated_at": "2024-01-15 10:30:00"
  }
}
```

**开票信息不存在时的响应示例**:
```json
{
  "success": true,
  "message": "获取开票信息成功",
  "data": null
}

**失败响应示例**:
```json
{
  "success": false,
  "error": "参数错误",
  "details": "设备号不能为空"
}
```
### 14.7 根据客户ID获取开票信息

**路径**: `/api/v1/invoices/invoice-info/customer/:customer_id`
**方法**: `GET`
**描述**: 根据客户ID获取开票信息
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `customer_id` | `number` | 是 | 客户ID |

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取开票信息成功",
  "data": {
    "id": 1,
    "device_no": "DEV001",
    "customer_id": 101,
    "customer_name": "测试客户",
    "invoice_title": "测试公司",
    "invoice_type": 1,
    "invoice_type_text": "增值税普票",
    "taxpayer_id": "91110105MA00000000",
    "address": "北京市朝阳区",
    "phone": "010-12345678",
    "bank_name": "中国工商银行",
    "bank_account": "6222020000000000000",
    "created_at": "2024-01-15 10:30:00",
    "updated_at": "2024-01-15 10:30:00"
  }
}
```

**失败响应示例**:
```json
{
  "success": false,
  "error": "参数错误",
  "details": "客户ID必须是有效的数字"
}

**失败响应示例**:
```json
{
  "success": false,
  "error": "开票信息不存在",
  "details": "找不到客户ID为101的开票信息"
}
```
### 14.8 获取开票信息列表

**路径**: `/api/v1/invoices/invoice-info/list`
**方法**: `GET`
**描述**: 获取开票信息列表，支持分页和关键词搜索
**请求头**:
- `Authorization`: Bearer token (管理员)

**请求参数**:
| 参数名 | 类型 | 必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | 否 | 1 | 页码 |
| `pageSize` | `number` | 否 | 10 | 每页数量（1-100） |
| `keyword` | `string` | 否 | 空字符串 | 搜索关键词 |

**成功响应示例**:
```json
{
  "success": true,
  "message": "获取开票信息列表成功",
  "data": {
    "list": [
      {
        "id": 1,
        "device_no": "DEV001",
        "customer_id": 101,
        "customer_name": "测试客户",
        "invoice_title": "测试公司",
        "invoice_type": 1,
        "invoice_type_text": "增值税普票",
        "taxpayer_id": "91110105MA00000000",
        "address": "北京市朝阳区",
        "phone": "010-12345678",
        "bank_name": "中国工商银行",
        "bank_account": "6222020000000000000",
        "created_at": "2024-01-15 10:30:00",
        "updated_at": "2024-01-15 10:30:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 10,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

**失败响应示例**:
```json
{
  "success": false,
  "error": "参数错误",
  "details": "页码和每页数量必须是有效的数字"
}
```
### 14.9 删除开票信息

**路径**: `/api/v1/invoices/invoice-info/:id`
**方法**: `DELETE`
**描述**: 删除指定的开票信息
**请求头**:
- `Authorization`: Bearer token (管理员)

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | `number` | 是 | 开票信息ID |

**成功响应示例**:
```json
{
  "success": true,
  "message": "开票信息删除成功"
}
```

**失败响应示例**:
```json
{
  "success": false,
  "error": "参数错误",
  "details": "开票信息ID必须是有效的数字"
}

**失败响应示例**:
```json
{
  "success": false,
  "error": "删除失败",
  "details": "开票信息不存在或已被删除"
}

```
## 15. 统一响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功的描述信息",
  "data": {
    // 具体的数据内容
  }
}
```

### 失败响应

```json
{
  "success": false,
  "message": "错误描述信息",
  "statusCode": 错误状态码
}
```

或者

```json
{
  "success": false,
  "error": "错误类型",
  "details": "详细错误信息",
  "statusCode": 错误状态码
}
```

### 分页响应

```json
{
  "success": true,
  "message": "获取列表成功",
  "data": {
    "列表名称": [
      // 列表数据项
    ],
    "total": 总记录数,
    "page": 当前页码,
    "pageSize": 每页数量,
    "totalPages": 总页数
  }
}
```
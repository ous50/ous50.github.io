---
title: "eUICC 管理详解"
slug: "euicc-management-explained"
date: "2026-06-20"
lastmod: "2026-06-20"
draft: false
aliases:
  - /p/euicc-管理详解/
tags:
- EasyEUICC
- eSIM
- OMAPI
- Telephony
- Android
- STK
categories:
- 软件
- 安卓
- 通信
- eSIM
description: "本文介绍如何使用 Android™ 设备管理你的 eUICC（即 eSIM）设备。"
---

## 简介

正如我在[之前关于 UICC 历史的文章](../eUICC-Explained)中所述，**eUICC** 是一种可编程平台。Android™ 为用户提供了多种管理 eUICC（下文称为 eSIM）的方式，包括但不限于通过 [OMAPI](https://euicc-manual.osmocom.org/docs/android/open-mobile-api/)（Open Mobile API，需要 Android 9 / API 28 或更高版本）或 [Android Telephony API](https://developer.android.com/reference/android/telephony/euicc/EuiccManager)（需要 root 权限和 Android 11 或更高版本；你可以通过 Magisk 替换手机上的默认 eSIM 管理入口）使用 [LPA（本地配置文件助手）](https://source.android.com/docs/core/connect/esim-overview#make-lpa-app)。

本文主要演示如何使用 OpenEUICC 和 EasyEUICC 这两款应用来区分 OMAPI 和 Android Telephony API。这两款应用由 [Peter Cai](https://gitea.angry.im/PeterCxy) 开发，并[共享同一份代码库](https://gitea.angry.im/PeterCxy/OpenEUICC)。它们唯一的区别是所使用的管理 API（EasyEUICC 面向非特权用户，OpenEUICC 面向特权用户）。它们的差异如下表所示：

|                               |            OpenEUICC            |      EasyEUICC      |
|:------------------------------|:-------------------------------:|:-------------------:|
| 需要特权                      | 必须作为系统应用安装            |         否          |
| 内部 eSIM                     |            支持                 |      不支持         |
| 外部 eSIM [^1]                |            支持                 |       支持          |
| USB 读卡器                    |            支持                 |       支持          |
| 需要 eSIM 白名单              |               否                |  是 — USB 除外      |
| 系统集成                      |          部分 [^2]              |         否          |
| 最低 Android 版本             |      Android 11 或更高          | Android 9 或更高    |

[^1]: 也称为 "可移动 eSIM"
[^2]: 运营商合作伙伴 API 尚未实现



### 如果你有兴趣购买兼容的可移动 eSIM 卡

我们与多家优秀的制造商合作，为你提供一些折扣选择。点击下方链接以更优惠的价格购买，如果你喜欢这篇文章，也能支持我。

- [eSTK.me](https://store.estk.me/products?code=ous50) - 省心的选择。支持任意 LPA 应用，甚至可以在任何 Android 或 iPhone 上管理配置文件。结账时使用优惠码 `OUS50` 可享 **9 折**。
- [9eSIM](https://www.9esim.com/shop/) - 经济实惠的选择。结账时使用 `OUS50` 可享 **9折**。



## EasyEUICC - OMAPI

{{< gh-blockquote type="note" >}} 除非你自己编译 EasyEUICC，否则**你必须确保你的外部 eSIM 设备与 `EasyEUICC` 兼容**，这意味着设备必须符合 GSMA SGP.22 规范，并且**必须支持**这个特定的 ARA-M SHA-1 值：`2A2FA878BC7C3354C2CF82935A5945A3EDAE4AFA`，然后才能继续操作。{{< /gh-blockquote >}}

### 下载

你可以直接从 [EasyEUICC 官方页面](https://easyeuicc.org/en/) 下载应用。



### 首次使用

首次启动时，EasyEUICC 应用会检查你的 Android 手机对 OMAPI 的兼容性，并显示你可以用来管理[兼容外部 eSIM 设备](#如果你有兴趣购买兼容的可移动-esim-卡)的 SIM 卡槽。



{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.zh-cn/allow-notification.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.zh-cn/first-start-check.png" >}}
{{< /gallery >}}

点击 `Continue` 按钮继续，你将进入主界面：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.zh-cn/main-page.png" >}}
{{< /gallery >}}
{{< gh-blockquote type="note" >}} 如果你只想添加/管理你的 eSIM 配置文件，直接跳到[这里](#添加-esim-配置文件)。{{< /gh-blockquote >}}


### 设置页面

点击右上角的 `⋮` 按钮可以查看设置：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.zh-cn/settings.png" >}}
{{< /gallery >}}


### 添加 eSIM 配置文件

点击右下角的 `+` 按钮，然后**选择你要下载配置文件到的 eSIM 设备**：

{{< gh-blockquote type="note" >}} 你应该通过 `eID` 而不是 `ICCID` 来确认你的 eSIM。`eID` 是你的 **eSIM 设备（插入手机的卡片）**识别号，而 `ICCID` 是你的 eSIM 配置文件识别号。{{< /gh-blockquote >}}

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.zh-cn/download-profile-select-eSIM.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.zh-cn/download-profile-install-method.png" >}}
{{< /gallery >}}

选择你想使用的方式（通常是用相机扫描二维码或从相册加载二维码）。在与目标服务器校验后，配置文件下载将开始：

{{< gh-blockquote type="warning" >}} 下载配置文件时，请确保你**拥有稳定可达的网络连接**。否则**你可能会永久丢失配置文件**，因为配置文件发放服务器已将你的配置文件标记为已下载。{{< /gh-blockquote >}}

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/download-profile-progress.png" >}}
{{< /gallery >}}


#### 如果你需要使用原始数据下载配置文件，或二维码无法使用

则选择最后一个选项 `Enter manually`。输入你的提供商给你的对应字符串：


{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.zh-cn/download-profile-manual.png" >}}
{{< /gallery >}}

### 配置文件下载完成后

配置文件下载完成后，你可以在主页面查看、切换和重命名该配置文件：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-toggle-profile.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-config-profile-name.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-after-profile-name-changed.png" >}}
{{< /gallery >}}

{{< gh-blockquote type="note" >}} 我每天都在使用 `esim.gg`，多年来在全球旅行时它一直非常可靠和稳定。目前数据-only eSIM 没有折扣，但如果你在结账时使用 `ous50` 购买新的爱沙尼亚号码，可以减免 0.3 欧元。{{< /gh-blockquote >}}


## 故障排除

### OMAPI 检测失败

这种情况下，你的手机或系统不支持通过 OMAPI 使用 EasyEUICC。考虑在获取 root 权限后使用 OpenEUICC，或更换为较新的设备。

### 配置文件下载失败

检查错误代码，尝试重新扫描二维码，或[手动下载配置文件](#如果你需要使用原始数据下载配置文件或二维码无法使用)。

{{< gh-blockquote type="warning" >}} 下载配置文件时，请确保你**拥有稳定可达的网络连接**。否则**你可能会永久丢失配置文件**，因为配置文件发放服务器已将你的配置文件标记为已下载。{{< /gh-blockquote >}}

如果你已经用尽下载次数，请联系你的 eSIM 配置文件提供商寻求进一步帮助。

### 找不到 eSIM 卡/设备

你的 eSIM 卡/设备可能与 EasyEUICC 不兼容。点击[这里](#easyeuicc---omapi)查看更多信息。

## 常见问题

### 使用这个应用会被运营商封号吗？

一般来说不会。但运营商有自己的黑名单，某些 eSIM 卡制造商/型号可能会被拉黑。
购买[上文列出](#如果你有兴趣购买兼容的可移动-esim-卡)的优质 eSIM 卡，并遵循你的提供商的说明。

### 我能在其他手机上使用这些卡吗？

可以，在你正确设置好 eSIM 卡/设备并切换、配置好所需的配置文件后，**你可以像使用普通实体 SIM 卡一样使用这些卡**。

你可以在任何支持 OMAPI 的 Android 手机上使用 EasyEUICC 应用来管理[兼容卡片](#如果你有兴趣购买兼容的可移动-esim-卡)上的配置文件。

对于 eSTK 卡，你甚至可以在 iPhone 上通过 STK 应用来管理配置文件。

## 脚注


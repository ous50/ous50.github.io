---
title: "eUICC 管理详解"
slug: "euicc-management-explained"
date: "2026-06-20"
lastmod: "2026-06-20"
draft: false
aliases:
  - /yue-cn/p/euicc-管理详解/
  - /yue-cn/p/euicc-管理詳解/
tags:
- EasyEUICC
- eSIM
- OMAPI
- Telephony
- Android
- STK
categories:
- 软件
- Android
- 通信
- eSIM
description: "本文介绍点用 Android™ 设备管理你嘅 eUICC（即系 eSIM）设备。"
---

## 简介

正如我喺[之前篇关于 UICC 历史嘅文章](../eUICC-Explained)入面讲过，**eUICC** 系一个可编程平台。Android™ 提供咗多种方法畀用户管理 eUICC（下文称为 eSIM），包括但唔限于透过 [OMAPI](https://euicc-manual.osmocom.org/docs/android/open-mobile-api/)（Open Mobile API，需要 Android 9 / API 28 或更高版本）或者 [Android Telephony API](https://developer.android.com/reference/android/telephony/euicc/EuiccManager)（需要 root 权限同 Android 11 或更高版本；你可以用 Magisk 取代手机上预设嘅 eSIM 管理入口）去使用 [LPA（本地设定档助手）](https://source.android.com/docs/core/connect/esim-overview#make-lpa-app)。

本文主要示范点样用 OpenEUICC 同 EasyEUICC 呢两个 app 嚟区分 OMAPI 同 Android Telephony API。呢两个 app 由 [Peter Cai](https://gitea.angry.im/PeterCxy) 开发，而且[共享同一份代码库](https://gitea.angry.im/PeterCxy/OpenEUICC)。佢哋唯一嘅区别系所用嘅管理 API（EasyEUICC 畀非特权用户，OpenEUICC 畀特权用户）。佢哋嘅分别如下表所示：

|                               |            OpenEUICC            |      EasyEUICC      |
|:------------------------------|:-------------------------------:|:-------------------:|
| 需要特权                      | 必须作为系统应用安装            |         否          |
| 内部 eSIM                     |            支援                 |      唔支援         |
| 外部 eSIM [^1]                |            支援                 |       支援          |
| USB 读卡器                    |            支援                 |       支援          |
| 需要 eSIM 白名单              |               否                |  系 — USB 除外      |
| 系统整合                      |          部分 [^2]              |         否          |
| 最低 Android 版本             |      Android 11 或更高          | Android 9 或更高    |

[^1]: 亦称为「可移动 eSIM」
[^2]: 电讯商合作伙伴 API 尚未实现



### 如果你有兴趣购买兼容嘅可移动 eSIM 卡

我哋同多家优秀嘅制造商合作，为你提供一啲折扣选择。揿下面连结以更抵价购买，如果你钟意呢篇文章，都可以支持我。

- [eSTK.me](https://store.estk.me/products?code=ous50) - 省心嘅选择。支援任意 LPA app，甚至可以用任何 Android 或 iPhone 管理设定档。结账时用优惠码 `OUS50` 可享 **9 折**。
- [9eSIM](https://www.9esim.com/shop/) - 经济实惠嘅选择。结账时用 `OUS50` 可享 **9 折**。



## EasyEUICC - OMAPI

{{< gh-blockquote type="note" >}} 除非你自己编译 EasyEUICC，否则**你必须确保你嘅外部 eSIM 设备同 `EasyEUICC` 兼容**，即系话设备必须符合 GSMA SGP.22 规范，而且**必须支援**呢个特定嘅 ARA-M SHA-1 值：`2A2FA878BC7C3354C2CF82935A5945A3EDAE4AFA`，跟住先可以继续操作。{{< /gh-blockquote >}}

### 下载

你可以直接喺 [EasyEUICC 官方页面](https://easyeuicc.org/en/) 下载 app。



### 首次使用

首次启动时，EasyEUICC app 会检查你部 Android 手机对 OMAPI 嘅兼容性，并显示你可以用嚟管理[兼容外部 eSIM 设备](#如果你有兴趣购买兼容嘅可移动-esim-卡)嘅 SIM 卡槽。



{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/allow-notification.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/first-start-check.png" >}}
{{< /gallery >}}

揿 `Continue` 按钮继续，你就会进入主介面：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/main-page.png" >}}
{{< /gallery >}}
{{< gh-blockquote type="note" >}} 如果你只想新增/管理你嘅 eSIM 设定档，直接跳到[呢度](#新增-esim-设定档)。{{< /gh-blockquote >}}


### 设定页面

揿右上角嘅 `⋮` 按钮可以睇设定：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/settings.png" >}}
{{< /gallery >}}


### 新增 eSIM 设定档

揿右下角嘅 `+` 按钮，然后**拣你想下载设定档去边个 eSIM 设备**：

{{< gh-blockquote type="note" >}} 你应该用 `eID` 而唔系 `ICCID` 嚟确认你嘅 eSIM。`eID` 系你嘅 **eSIM 设备（插入手机嘅卡）**识别号码，而 `ICCID` 系你嘅 eSIM 设定档识别号码。{{< /gh-blockquote >}}

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-select-eSIM.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-install-method.png" >}}
{{< /gallery >}}

拣你想用嘅方式（通常系用相机扫描二维码或者从相簿载入二维码）。同目标伺服器核对后，设定档下载就会开始：

{{< gh-blockquote type="warning" >}} 下载设定档𠮶阵，请确保你**有稳定可达嘅网络连接**。否则**你可能会永久遗失个设定档**，因为设定档派发伺服器已经将你嘅设定档标记为已下载。{{< /gh-blockquote >}}

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/download-profile-progress.png" >}}
{{< /gallery >}}


#### 如果你需要用原始数据下载设定档，或者二维码用唔到

就拣最后一个选项 `Enter manually`。输入你嘅供应商畀你嘅对应字串：


{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-manual.png" >}}
{{< /gallery >}}

### 设定档下载完成后

设定档下载完成后，你可以喺主页面查看、切换同修名个设定档：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-toggle-profile.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-config-profile-name.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-after-profile-name-changed.png" >}}
{{< /gallery >}}

{{< gh-blockquote type="note" >}} 我每日都用紧 `esim.gg`，几年嚟喺全球旅行时佢一直都非常可靠稳定。而家数据-only eSIM 冇折扣，但如果你结账时用 `ous50` 买个新嘅爱沙尼亚号码，可以减 0.3 欧元。{{< /gh-blockquote >}}


## 故障排除

### OMAPI 检测失败

呢种情况下，你部手机或者系统唔支援透过 OMAPI 用 EasyEUICC。考虑喺取得 root 权限后用 OpenEUICC，或者换部新啲嘅设备。

### 设定档下载失败

检查错误代码，试吓重新扫描二维码，或者[手动下载设定档](#如果你需要用原始数据下载设定档或者二维码用唔到)。

{{< gh-blockquote type="warning" >}} 下载设定档𠮶阵，请确保你**有稳定可达嘅网络连接**。否则**你可能会永久遗失个设定档**，因为设定档派发伺服器已经将你嘅设定档标记为已下载。{{< /gh-blockquote >}}

如果你已经用晒下载次数，请联络你嘅 eSIM 设定档供应商寻求进一步协助。

### 揾唔到 eSIM 卡/设备

你嘅 eSIM 卡/设备可能同 EasyEUICC 唔兼容。揿[呢度](#easyeuicc---omapi)睇更多资讯。

## 常见问题

### 用呢个 app 会唔会被电讯商封号？

一般嚟讲唔会。但电讯商有自己嘅黑名单，某啲 eSIM 卡制造商/型号可能会被拉黑。
推荐你购买[上文列出](#如果你有兴趣购买兼容嘅可移动-esim-卡)嘅优质 eSIM 卡，并遵循你嘅供应商嘅指示。

### 我可以用呢啲卡喺其他手机上面用吗？

可以，喺你正确设定好 eSIM 卡/设备，并切换、配置好想要嘅设定档之后，**你可以好似用普通实体 SIM 卡咁用呢啲卡**。

你可以喺任何支援 OMAPI 嘅 Android 手机上面用 EasyEUICC app 嚟管理[兼容卡](#如果你有兴趣购买兼容嘅可移动-esim-卡)上面嘅设定档。

对于 eSTK 卡，你甚至可以喺 iPhone 上面透过 STK 应用嚟管理设定档。

## 脚注


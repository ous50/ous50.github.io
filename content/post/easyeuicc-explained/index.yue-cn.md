---
title: "eUICC 管理詳解"
date: "2026-06-20"
lastmod: "2026-06-20"
draft: false
tags:
- EasyEUICC
- eSIM
- OMAPI
- Telephony
- Android
- STK
categories:
- SoftWare
- Android
description: "本文介紹點用 Android™ 設備管理你嘅 eUICC（即係 eSIM）設備。"
---

## 簡介

正如我喺[之前篇關於 UICC 歷史嘅文章](../eUICC-Explained)入面講過，**eUICC** 係一個可編程平台。Android™ 提供咗多種方法畀用戶管理 eUICC（下文稱為 eSIM），包括但唔限於透過 [OMAPI](https://euicc-manual.osmocom.org/docs/android/open-mobile-api/)（Open Mobile API，需要 Android 9 / API 28 或更高版本）或者 [Android Telephony API](https://developer.android.com/reference/android/telephony/euicc/EuiccManager)（需要 root 權限同 Android 11 或更高版本；你可以用 Magisk 取代手機上預設嘅 eSIM 管理入口）去使用 [LPA（本地設定檔助手）](https://source.android.com/docs/core/connect/esim-overview#make-lpa-app)。

本文主要示範點樣用 OpenEUICC 同 EasyEUICC 呢兩個 app 嚟區分 OMAPI 同 Android Telephony API。呢兩個 app 由 [Peter Cai](https://gitea.angry.im/PeterCxy) 開發，而且[共享同一份代碼庫](https://gitea.angry.im/PeterCxy/OpenEUICC)。佢哋唯一嘅區別係所用嘅管理 API（EasyEUICC 畀非特權用戶，OpenEUICC 畀特權用戶）。佢哋嘅分別如下表所示：

|                               |            OpenEUICC            |      EasyEUICC      |
|:------------------------------|:-------------------------------:|:-------------------:|
| 需要特權                      | 必須作為系統應用安裝            |         否          |
| 內部 eSIM                     |            支援                 |      唔支援         |
| 外部 eSIM [^1]                |            支援                 |       支援          |
| USB 讀卡器                    |            支援                 |       支援          |
| 需要 eSIM 白名單              |               否                |  係 — USB 除外      |
| 系統整合                      |          部分 [^2]              |         否          |
| 最低 Android 版本             |      Android 11 或更高          | Android 9 或更高    |

[^1]: 亦稱為「可移動 eSIM」
[^2]: 電訊商合作夥伴 API 尚未實現



### 如果你有興趣購買兼容嘅可移動 eSIM 卡

我哋同多家優秀嘅製造商合作，為你提供一啲折扣選擇。撳下面連結以更抵價購買，如果你鍾意呢篇文章，都可以支持我。

- [eSTK.me](https://store.estk.me/products?code=ous50) - 省心嘅選擇。支援任意 LPA app，甚至可以用任何 Android 或 iPhone 管理設定檔。結賬時用優惠碼 `OUS50` 可享 **9 折**。
- [9eSIM](https://www.9esim.com/shop/) - 經濟實惠嘅選擇。結賬時用 `OUS50` 可享 **9 折**。



## EasyEUICC - OMAPI

{{< gh-blockquote type="note" >}} 除非你自己編譯 EasyEUICC，否則**你必須確保你嘅外部 eSIM 設備同 `EasyEUICC` 兼容**，即係話設備必須符合 GSMA SGP.22 規範，而且**必須支援**呢個特定嘅 ARA-M SHA-1 值：`2A2FA878BC7C3354C2CF82935A5945A3EDAE4AFA`，跟住先可以繼續操作。{{< /gh-blockquote >}}

### 下載

你可以直接喺 [EasyEUICC 官方頁面](https://easyeuicc.org/en/) 下載 app。



### 首次使用

首次啟動時，EasyEUICC app 會檢查你部 Android 手機對 OMAPI 嘅兼容性，並顯示你可以用嚟管理[兼容外部 eSIM 設備](#如果你有興趣購買兼容嘅可移動-esim-卡)嘅 SIM 卡槽。



{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/allow-notification.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/first-start-check.png" >}}
{{< /gallery >}}

撳 `Continue` 按鈕繼續，你就會進入主介面：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/main-page.png" >}}
{{< /gallery >}}
{{< gh-blockquote type="note" >}} 如果你只想新增/管理你嘅 eSIM 設定檔，直接跳到[呢度](#新增-esim-設定檔)。{{< /gh-blockquote >}}


### 設定頁面

撳右上角嘅 `⋮` 按鈕可以睇設定：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/settings.png" >}}
{{< /gallery >}}


### 新增 eSIM 設定檔

撳右下角嘅 `+` 按鈕，然後**揀你想下載設定檔去邊個 eSIM 設備**：

{{< gh-blockquote type="note" >}} 你應該用 `eID` 而唔係 `ICCID` 嚟確認你嘅 eSIM。`eID` 係你嘅 **eSIM 設備（插入手機嘅卡）**識別號碼，而 `ICCID` 係你嘅 eSIM 設定檔識別號碼。{{< /gh-blockquote >}}

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-select-eSIM.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-install-method.png" >}}
{{< /gallery >}}

揀你想用嘅方式（通常係用相機掃描二維碼或者從相簿載入二維碼）。同目標伺服器核對後，設定檔下載就會開始：

{{< gh-blockquote type="warning" >}} 下載設定檔嗰陣，請確保你**有穩定可達嘅網絡連接**。否則**你可能會永久遺失個設定檔**，因為設定檔派發伺服器已經將你嘅設定檔標記為已下載。{{< /gh-blockquote >}}

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/download-profile-progress.png" >}}
{{< /gallery >}}


#### 如果你需要用原始數據下載設定檔，或者二維碼用唔到

就揀最後一個選項 `Enter manually`。輸入你嘅供應商畀你嘅對應字串：


{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-manual.png" >}}
{{< /gallery >}}

### 設定檔下載完成後

設定檔下載完成後，你可以喺主頁面查看、切換同修名個設定檔：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-toggle-profile.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-config-profile-name.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-after-profile-name-changed.png" >}}
{{< /gallery >}}

{{< gh-blockquote type="note" >}} 我每日都用緊 `esim.gg`，幾年嚟喺全球旅行時佢一直都非常可靠穩定。而家數據-only eSIM 冇折扣，但如果你結賬時用 `ous50` 買個新嘅愛沙尼亞號碼，可以減 0.3 歐元。{{< /gh-blockquote >}}


## 故障排除

### OMAPI 檢測失敗

呢種情況下，你部手機或者系統唔支援透過 OMAPI 用 EasyEUICC。考慮喺取得 root 權限後用 OpenEUICC，或者換部新啲嘅設備。

### 設定檔下載失敗

檢查錯誤代碼，試吓重新掃描二維碼，或者[手動下載設定檔](#如果你需要用原始數據下載設定檔或者二維碼用唔到)。

{{< gh-blockquote type="warning" >}} 下載設定檔嗰陣，請確保你**有穩定可達嘅網絡連接**。否則**你可能會永久遺失個設定檔**，因為設定檔派發伺服器已經將你嘅設定檔標記為已下載。{{< /gh-blockquote >}}

如果你已經用晒下載次數，請聯絡你嘅 eSIM 設定檔供應商尋求進一步協助。

### 搵唔到 eSIM 卡/設備

你嘅 eSIM 卡/設備可能同 EasyEUICC 唔兼容。撳[呢度](#easyeuicc---omapi)睇更多資訊。

## 常見問題

### 用呢個 app 會唔會被電訊商封號？

一般嚟講唔會。但電訊商有自己嘅黑名單，某啲 eSIM 卡製造商/型號可能會被拉黑。
買[上文列出](#如果你有興趣購買兼容嘅可移動-esim-卡)嘅優質 eSIM 卡，並遵循你嘅供應商嘅指示。

### 我可以用呢啲卡喺其他手機上面用嗎？

可以，喺你正確設定好 eSIM 卡/設備，並切換、配置好想要嘅設定檔之後，**你可以好似用普通實體 SIM 卡咁用呢啲卡**。

你可以喺任何支援 OMAPI 嘅 Android 手機上面用 EasyEUICC app 嚟管理[兼容卡](#如果你有興趣購買兼容嘅可移動-esim-卡)上面嘅設定檔。

對於 eSTK 卡，你甚至可以喺 iPhone 上面透過 STK 應用嚟管理設定檔。

## 腳註


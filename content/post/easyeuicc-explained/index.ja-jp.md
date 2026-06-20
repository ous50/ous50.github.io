---
title: "eUICC 管理の解説"
date: 2026-04-06T22:39:33+08:00
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
description: "Android™ デバイスを使って eUICC（eSIM）デバイスを管理する方法を解説します。"
---

## はじめに

私の[以前の UICC の歴史に関する記事](../eUICC-Explained)で述べたように、**eUICC** はプログラム可能なプラットフォームです。Android™ には、ユーザーが eUICC（以下、eSIM と呼びます）を管理するための複数の方法が用意されています。例えば、[OMAPI](https://euicc-manual.osmocom.org/docs/android/open-mobile-api/)（Open Mobile API、Android 9 / API 28 以降が必要）や [Android Telephony API](https://developer.android.com/reference/android/telephony/euicc/EuiccManager)（root 権限と Android 11 以降が必要。Magisk を使って端末のデフォルト eSIM 管理ポータルを置き換えることができます）を介して [LPA（ローカル プロファイル アシスタント）](https://source.android.com/docs/core/connect/esim-overview#make-lpa-app)を使用する方法があります。

この記事では、OpenEUICC と EasyEUICC という 2 つのアプリを使って、OMAPI と Android Telephony API の違いを紹介します。これらのアプリは [Peter Cai](https://gitea.angry.im/PeterCxy) によって開発され、[同じコードベースを共有しています](https://gitea.angry.im/PeterCxy/OpenEUICC)。違いは使用する管理 API のみで、EasyEUICC は非特権ユーザー向け、OpenEUICC は特権ユーザー向けです。両者の違いを以下の表にまとめます。

|                               |            OpenEUICC            |      EasyEUICC      |
|:------------------------------|:-------------------------------:|:-------------------:|
| 特権が必要                    | システムアプリとしてインストールが必要 |         不要        |
| 内蔵 eSIM                     |            対応                 |      非対応         |
| 外付け eSIM [^1]              |            対応                 |       対応          |
| USB リーダー                  |            対応                 |       対応          |
| eSIM のホワイトリスト登録が必要 |               不要              |  必要 — USB を除く  |
| システム統合                  |          部分的 [^2]            |         なし        |
| 最低 Android バージョン       |      Android 11 以降            | Android 9 以降      |

[^1]: 「リムーバブル eSIM」とも呼ばれます
[^2]: キャリア パートナー API は未実装です



### 互換性のあるリムーバブル eSIM カードの購入を検討している場合

私たちは複数の優れたメーカーと提携しており、割引価格で購入できる選択肢を用意しています。以下のリンクからお得に購入していただくか、この記事が気に入った場合は私を支援してください。

- [eSTK.me](https://store.estk.me/products?code=ous50) - 手間いらずの選択。任意の LPA アプリを使用でき、Android や iPhone 上でプロファイルを管理できます。チェックアウト時にクーポンコード `OUS50` を使用すると **10% OFF** になります。
- [9eSIM](https://www.9esim.com/shop/) - お手頃な選択。チェックアウト時に `OUS50` を使用すると **10% OFF** になります。



## EasyEUICC - OMAPI

{{< gh-blockquote type="note" >}} 自分で EasyEUICC をコンパイルしない限り、**外部 eSIM デバイスが `EasyEUICC` と互換性があることを確認する必要があります**。つまり、デバイスは GSMA SGP.22 仕様に準拠し、以下の特定の ARA-M SHA-1 値を**サポートしている必要があります**：`2A2FA878BC7C3354C2CF82935A5945A3EDAE4AFA`。これを確認してから操作を進めてください。{{< /gh-blockquote >}}

### ダウンロード

アプリは [EasyEUICC 公式ページ](https://easyeuicc.org/en/) から直接ダウンロードできます。



### 初回使用

初回起動時、EasyEUICC アプリは Android 端末の OMAPI 互換性をチェックし、[互換性のある外部 eSIM デバイス](#互換性のあるリムーバブル-esim-カードの購入を検討している場合)を管理できる SIM スロットを表示します。



{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/allow-notification.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/first-start-check.png" >}}
{{< /gallery >}}

`Continue` ボタンをタップして進むと、メイン画面が表示されます：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/main-page.png" >}}
{{< /gallery >}}
{{< gh-blockquote type="note" >}} eSIM プロファイルの追加/管理だけを行いたい場合は、[こちら](#esim-プロファイルの追加)までジャンプしてください。{{< /gh-blockquote >}}


### 設定画面

右上隅の `⋮` ボタンをタップすると、設定を確認できます：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/settings.png" >}}
{{< /gallery >}}


### eSIM プロファイルの追加

右下隅の `+` ボタンをタップし、プロファイルをダウンロードしたい **eSIM デバイスを選択**します：

{{< gh-blockquote type="note" >}} eSIM の確認は `ICCID` ではなく `eID` で行う必要があります。`eID` は **eSIM デバイス（携帯に挿入されたカード）**の識別番号であり、`ICCID` は eSIM プロファイルの識別番号です。{{< /gh-blockquote >}}

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-select-eSIM.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-install-method.png" >}}
{{< /gallery >}}

使用したい方法を選択します（通常はカメラで QR コードをスキャンするか、ギャラリーから QR コードを読み込みます）。対象サーバーとの確認後、プロファイルのダウンロードが開始されます：

{{< gh-blockquote type="warning" >}} プロファイルをダウンロードする際は、**安定した到達可能なインターネット接続**があることを確認してください。そうしないと、プロファイル発行サーバーがあなたのプロファイルをダウンロード済みとしてマークしているため、**プロファイルを永久に失う可能性があります**。{{< /gh-blockquote >}}

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/download-profile-progress.png" >}}
{{< /gallery >}}


#### 生データでプロファイルをダウンロードする必要がある場合、または QR コードが機能しない場合

最後のオプション `Enter manually` を選択します。プロバイダーから提供された対応する文字列を入力してください：


{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-manual.png" >}}
{{< /gallery >}}

### プロファイルのダウンロード後

プロファイルのダウンロードが完了すると、メイン画面でそのプロファイルの表示、切り替え、名前の変更ができます：

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-toggle-profile.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-config-profile-name.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-after-profile-name-changed.png" >}}
{{< /gallery >}}

{{< gh-blockquote type="note" >}} 私は毎日 `esim.gg` を使用しており、数年間世界中を旅行しながら非常に信頼性が高く安定しています。現在、データ専用 eSIM に割引はありませんが、チェックアウト時に `ous50` を使用して新しいエストニア番号を購入すると、0.3 ユーロ割引されます。{{< /gh-blockquote >}}


## トラブルシューティング

### OMAPI 検出に失敗した

この場合、お使いの携帯電話またはシステムは OMAPI 経由で EasyEUICC をサポートしていません。root 権限を取得して OpenEUICC を使用するか、より新しい端末に切り替えることを検討してください。

### プロファイルのダウンロードに失敗した

エラーコードを確認し、QR コードを再度スキャンするか、[プロファイルを手動でダウンロード](#生データでプロファイルをダウンロードする必要がある場合または-qr-コードが機能しない場合)してみてください。

{{< gh-blockquote type="warning" >}} プロファイルをダウンロードする際は、**安定した到達可能なインターネット接続**があることを確認してください。そうしないと、プロファイル発行サーバーがあなたのプロファイルをダウンロード済みとしてマークしているため、**プロファイルを永久に失う可能性があります**。{{< /gh-blockquote >}}

ダウンロード回数を使い果たした場合は、eSIM プロファイルプロバイダーに問い合わせてください。

### eSIM カード/デバイスが見つからない

お使いの eSIM カード/デバイスが EasyEUICC と互換性がない可能性があります。詳細は[こちら](#easyeuicc---omapi)をご確認ください。

## よくある質問

### このアプリを使うとプロバイダーから BAN されますか？

一般的にはいいえ。ただし、プロバイダーには独自のブラックリストがあり、一部の eSIM カードメーカーやモデルがブラックリストに載っている場合があります。
[上記に記載されている](#互換性のあるリムーバブル-esim-カードの購入を検討している場合)良質な eSIM カードを購入し、プロバイダーの指示に従ってください。

### これらのカードは他の携帯電話で使えますか？

はい、eSIM カード/デバイスを正しく設定し、希望のプロファイルを切り替えて構成した後、**通常の物理 SIM カードと同じようにこれらのカードを使用できます**。

OMAPI に対応した Android 端末であれば、EasyEUICC アプリを使用して[互換性のあるカード](#互換性のあるリムーバブル-esim-カードの購入を検討している場合)上のプロファイルを管理できます。

eSTK カードの場合は、iPhone 上の STK アプリケーションを使ってプロファイルを管理することもできます。

## 脚注


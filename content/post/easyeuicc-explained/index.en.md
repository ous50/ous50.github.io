---
title: "eUICC management explained"
date: 2026-04-06T22:39:01+08:00
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
description: "This articles explained how to manage your eUICC(or 'eSIM') devices using Android™ devices."
---

## Introduction

As established in my [previous post on UICC history](../eUICC-Explained), an **eUICC** is a programmable platform. There're multiple ways provided by Android™ users to manage their eUICC (denoted as 'eSIM' as follows), included but not limited to using [LPAs(Local Profile Assists)](https://source.android.com/docs/core/connect/esim-overview#make-lpa-app) via [OMAPI](https://euicc-manual.osmocom.org/docs/android/open-mobile-api/)(Open Mobile API, requires Android 9 (API level 28) or later) or [Android Telephony API](https://developer.android.com/reference/android/telephony/euicc/EuiccManager)(requires root permission and Android 11 or later, which you can replace the default eSIM management portal in your phone using Magisk). 

This article mainly demonstrates the difference between OMAPI and Android Telephony API using OpenEUICC and EasyEUICC apps. These apps are developed by [Peter Cai](https://gitea.angry.im/PeterCxy) and shared [the same codebase](https://gitea.angry.im/PeterCxy/OpenEUICC). The only difference is the management API used (EasyEUICC for unprivileged users and OpenEUICC for privileged users). Their differences are shown below:

|                               |            OpenEUICC            |      EasyEUICC      |
|:------------------------------|:-------------------------------:|:-------------------:|
| Privileged                    | Must be installed as system app |         No          |
| Internal eSIM                 |            Supported            |     Unsupported     |
| External eSIM [^1]            |            Supported            |      Supported      |
| USB Readers                   |            Supported            |      Supported      |
| Requires allowlisting by eSIM |               No                |  Yes -- except USB  |
| System Integration            |          Partial [^2]           |         No          |
| Minimum Android Version       |      Android 11 or higher       | Android 9 or higher |

[^1]: Also known as "Removable eSIM"
[^2]: Carrier Partner API unimplemented yet



### If you are interested in purchasing compatible Removable eSIM cards

We have collaborated with multiple excellent manufacturers and have some discounts for your choices. Check the following to purchase cheaper and support me if you like this article. 

- [eSTK.me](https://store.estk.me/products?code=ous50) - The no-fuss choice. Use any LPA apps and even be able to manage profiles on Any Android or iPhone.
- [9eSIM](https://www.9esim.com/shop/) - affordable choices.



## EasyEUICC - OMAPI

{{< gh-blockquote type="note" >}} Unless you compile the EasyEUICC by yourself, **you have to make sure your external eSIM device is compatible with `EasyEUICC`**, which means the device MUST comply with the GSMA SGP.22 specification and **MUST INCLUDE** this specific ARA-M SHA-1 value: `2A2FA878BC7C3354C2CF82935A5945A3EDAE4AFA` before proceeded.
{{< /gh-blockquote >}}

### Download

You may download the app directly from [EasyEUICC official page](https://easyeuicc.org/en/). 



### First usage

At the first start, the EasyEUICC app would examine your android phone compability to OMAPI, and the SIM slot(s) you may use to manage your [compatible external eSIM devices](#If-you-are-interested-in-purchasing-compatible-Removable-eSIM-cards)



{{< gallery class="content-gallery" >}}
  {{< img src="assets.en/allow-notification.png" width="300x">}}
  {{< img src="assets.en/first-start-check.png" width="300x">}}
{{< /gallery >}}









## Footnotes




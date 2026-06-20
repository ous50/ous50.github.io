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
description: "This article explains how to manage your eUICC (or 'eSIM') devices using Android™ devices."
---

## Introduction

As established in my [previous post on UICC history](../eUICC-Explained), an **eUICC** is a programmable platform. Android™ provides multiple ways for users to manage their eUICC (referred to as 'eSIM' below), including but not limited to using [LPAs (Local Profile Assistants)](https://source.android.com/docs/core/connect/esim-overview#make-lpa-app) via [OMAPI](https://euicc-manual.osmocom.org/docs/android/open-mobile-api/) (Open Mobile API, requires Android 9 / API level 28 or later) or the [Android Telephony API](https://developer.android.com/reference/android/telephony/euicc/EuiccManager) (requires root permission and Android 11 or later; you can replace the default eSIM management portal on your phone using Magisk). 

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
[^2]: Carrier Partner API not implemented yet



### If you are interested in purchasing compatible Removable eSIM cards

We have collaborated with multiple excellent manufacturers and have some discounts for your choices. Check the following to purchase cheaper and support me if you like this article. 

- [eSTK.me](https://store.estk.me/products?code=ous50) - The no-fuss choice. Use any LPA apps and even be able to manage profiles on Any Android or iPhone. Use `OUS50` as coupon code at checkout to get **10% OFF**.
- [9eSIM](https://www.9esim.com/shop/) - affordable choices. use `OUS50` at checkout to get **10% OFF**.



## EasyEUICC - OMAPI

{{< gh-blockquote type="note" >}} Unless you compile the EasyEUICC by yourself, **you have to make sure your external eSIM device is compatible with `EasyEUICC`**, which means the device MUST comply with the GSMA SGP.22 specification and **MUST support** this specific ARA-M SHA-1 value: `2A2FA878BC7C3354C2CF82935A5945A3EDAE4AFA` before proceeding.
{{< /gh-blockquote >}}

### Download

You may download the app directly from [EasyEUICC official page](https://easyeuicc.org/en/). 



### First usage

At first launch, the EasyEUICC app will check your Android phone's OMAPI compatibility and show the SIM slot(s) you can use to manage your [compatible external eSIM devices](#if-you-are-interested-in-purchasing-compatible-removable-esim-cards)



{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/allow-notification.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/first-start-check.png" >}}
{{< /gallery >}}

Click the `Continue` button to proceed, and you will be taken to the main interface:

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/main-page.png" >}}
{{< /gallery >}}
{{< gh-blockquote type="note" >}} If you just want to add/manage your eSIM profiles, just go [here](#add-esim-profiles) 
{{< /gh-blockquote >}}


### Settings page
Click the `⋮` button in the upper right corner to check the settings:

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/settings.png" >}}
{{< /gallery >}}


### Add eSIM profiles

Click the `+` button in the lower right corner, and **select the eSIM device** you want to download the profile to:

{{< gh-blockquote type="note" >}} You should check your eSIM via `eID`, not `ICCID`. `eID` is your **eSIM device(the card inserted into your phone)** identification number and `ICCID` is your eSIM profile identification number.
{{< /gh-blockquote >}}

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-select-eSIM.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-install-method.png" >}}
{{< /gallery >}}

Choose the method you want to use (usually scanning a QR code with the camera or loading it from the gallery). The profile download will start after checking with the target server:

{{< gh-blockquote type="warning" >}} Make sure you **have a stable and reachable connection** when you are downloading profiles. Otherwise **you may lose your profile permanently** since the profile issuing server has marked your profile as downloaded.
{{< /gh-blockquote >}}

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/download-profile-progress.png" >}}
{{< /gallery >}}


#### If you need to download profile with raw data provided, or QR code is not working

Then select the last option `Enter manually`. Type in the strings your provider gave you:


{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.en/download-profile-manual.png" >}}
{{< /gallery >}}

### After Profile downloaded

When the profile is downloaded, you can view, toggle, and rename the profile on the main page:

{{< gallery class="content-gallery" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-toggle-profile.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-config-profile-name.png" >}}
  {{< img src="/images/easyeuicc-explained/assets.common/main-page-after-profile-name-changed.png" >}}
{{< /gallery >}}

{{< gh-blockquote type="note" >}} I have been using `esim.gg` every day for several years, and it has been exceptionally reliable and stable while I travel globally. Currently there is no discount for data-only eSIMs, but you can get 0.3 EUR off if you purchase a new Estonian number using `ous50` at checkout.{{< /gh-blockquote >}}


## Troubleshooting

### OMAPI detection failed
In this case, your phone or system does not support EasyEUICC via OMAPI. Consider using OpenEUICC after gaining root access, or switch to a more modern device.

### Profile download failed 
Check the error code, try scanning the QR code again or [downloading the profile manually](#if-you-need-to-download-profile-with-raw-data-provided-or-qr-code-is-not-working).

{{< gh-blockquote type="warning" >}} Make sure you **have a stable and reachable connection** when you are downloading profiles. Otherwise **you may lose your profile permanently** since the profile issuing server has marked your profile as downloaded.
{{< /gh-blockquote >}}

If you have run out of download attempts, contact your eSIM profile provider for further assistance.

### no eSIM card/device found

Your eSIM card/device might not be compatible with EasyEUICC. [Check here](#easyeuicc---omapi) for more information.

## FAQ

### Will I get banned by my provider for using this app?
Generally no. But providers have their own blacklist. Some eSIM card manufacturer/models might be blacklisted.
Purchase a good eSIM card [listed above](#if-you-are-interested-in-purchasing-compatible-removable-esim-cards) and follow the instructions from your provider. 

### Can I use these cards on other phones?
Yes, **you can use these cards like normal physical SIM cards** after you have properly set up the eSIM card/device and have toggled and configured your desired profile.

You can use the EasyEUICC app on any OMAPI-compatible Android phone to manage profiles on [compatible cards](#if-you-are-interested-in-purchasing-compatible-removable-esim-cards).

For eSTK cards, you can even manage your profiles on iPhones using the STK application.

## Footnotes




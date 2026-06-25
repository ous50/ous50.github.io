---
title: "eUICC Explained"
slug: "eUICC Explained"
date: 2026-04-07T22:42:49+08:00
draft: true
tags:
- UICC
- eUICC
- eSIM
categories:
- SoftWare
- Networking
description: "This articles explained the concept and development from SIM cards to eUICC (or 'eSIM')."
---

## TL;DR

* Modern "eSIM" enabled devices generally have eUICC chips.
* Physical "eSIM" are physical SIM cards that contains eUICC chips and thus enables users combining eSIM's flexibility of managing "SIM Cards" within one single chip and Physical SIM cards' convenience of swapping devices.
* Android™ has developed OMAPI to unifi the experience of managing eUICC profiles. This is how Android users manage their eSIM cards/devices. [^1]


[^1]: O. Fifty, *[EasyeUICC Explained](../euicc-management-explained#introduction)*, p.1

## Introduction

eUICC, or `embedded UICC`, is a chip that is supposed to be integrated into mobile terminals(e.g. phones, tablets, mobile wifi or POS, etc.).

SIM card, the abbreviation of `Subscriber Identity Module`, is a kind of UICC (Unified Integrated Circuit Cards) that stores various 

---
title:  关于 Prebuilt VPN 与 cgproxy 打架的这件事
date: 2022-02-17 00:10:24
tags:
- strongswan
- Linux
- cgproxy
- 全局代理
- 代理
- VPN
- L2TP
- 碎碎念
- 打架(?)
lang: zh-CN
description: 由于众所周知的原因，咱24/7挂着代理。因为linux有太多应用不看http_proxy变量，咱一直开着 cgproxy 来代理全机流量，一直都没有问题直到咱需要使用学校网络而尝试连接学校VPN。咕咕了好久之后，咱终于下定决心处理它。
---

# 关于 Prebuilt VPN 与 cgproxy 打架的这件事

## Update

2022-02-17: Initial post

2022-03-23: 看完log 找到了最终方法



## 太长不看版

直接跳到[最终解决方法](#最终解决方法)模块

## Intro

由于众所周知的原因，咱24/7挂着代理。

因为linux有太多应用不看http_proxy变量，咱一直开着 cgproxy 来代理全机流量，一直都没有问题

直到咱需要使用学校网络而尝试连接学校VPN。

~~咕咕了好久之后，咱终于下定决心处理它。~~

## 现象

正常上网的时候想连接学校的L2TP/IPsec VPN，打开 networkmanager 的 控制面板并点击连接VPN后它一直在转圈却没有成功

## 分析与解决

直接查看一手log

```zsh
sudo journalctl -f
```

再重复一次操作即可看到实时的log。在这里咱看到了这么一段：

```shell
Feb 16 23:51:49 testOnArch kded5[939]: org.kde.plasma.nm.kded: Unhandled VPN connection state change:  2
Feb 16 23:51:49 testOnArch akonadi_sendlater_agent[1283]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch kmail[1269]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_mailmerge_agent[1278]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_followupreminder_agent[1260]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_imap_resource[1262]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch qv2ray[1456]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_maildispatcher_agent[1276]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch kgpg[1244]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_davgroupware_resource[1257]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_notes_agent[1282]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch DiscoverNotifier[1053]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_sendlater_agent[1283]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_followupreminder_agent[1260]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_maildispatcher_agent[1276]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_davgroupware_resource[1257]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_imap_resource[1262]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_notes_agent[1282]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch akonadi_mailmerge_agent[1278]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch DiscoverNotifier[1053]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch qv2ray[1456]: "Object does not exist at path “/org/freedesktop/NetworkManager/ActiveConnection/2”"
Feb 16 23:51:49 testOnArch kded5[939]: org.kde.plasma.nm.kded: Unhandled VPN connection state change:  3
Feb 16 23:51:49 testOnArch NetworkManager[594]: <info>  [11] vpn-connection[,"foobar",0]: VPN connection: (ConnectInteractive) reply received
Feb 16 23:51:49 testOnArch nm-l2tp-service[31487]: Check port 1701
```

嗯，有个qv2ray在这里 大概是cgproxy把VPN位子占了（？）试试看把这玩意关掉：

```bash
systemctl stop cgproxy
```

再试一次 VPN就连接上了（

以前在用Windows的时候，clash是直接整了个tun网卡来实现全局代理的。现在咱用qv2ray+cgproxy，就发现了这个问题，但是一直都没有去仔细debug，~~大概这就是咕咕咕吧~~

## 在这之后

之后发现了关掉cgproxy之后连接vpn 再开cgproxy也能正常用

## 直到2022-03-23

今天被 LetITFly 大佬在他的频道推荐了这篇文章 咱受宠若惊 于是下定决心写完它 ~~不咕了不咕了不敢咕了~~

经过群友提醒 cgproxy可以设置不代理的软件

再跑了一遍 log ：

```shell
  nm-l2tp-service[39691]: xl2tpd started with pid 39768
  NetworkManager[39768]: xl2tpd[39768]: Not looking for kernel SAref support.
  kernel: PPP generic driver version 2.4.2
  kernel: NET: Registered PF_PPPOX protocol family
  kernel: l2tp_core: L2TP core driver, V2.0
  kernel: l2tp_netlink: L2TP netlink interface
  NetworkManager[39768]: xl2tpd[39768]: Using l2tp kernel support.
  NetworkManager[39768]: xl2tpd[39768]: xl2tpd version xl2tpd-1.3.17 started on yukinodaisuki PID:39768
  NetworkManager[39768]: xl2tpd[39768]: Written by Mark Spencer, Copyright (C) 1998, Adtran, Inc.
  NetworkManager[39768]: xl2tpd[39768]: Forked by Scott Balmos and David Stipp, (C) 2001
  NetworkManager[39768]: xl2tpd[39768]: Inherited by Jeff McAdams, (C) 2002
  NetworkManager[39768]: xl2tpd[39768]: Forked again by Xelerance (www.xelerance.com) (C) 2006-2016
  NetworkManager[39768]: xl2tpd[39768]: Listening on IP address 0.0.0.0, port 1701
  NetworkManager[39768]: xl2tpd[39768]: Connecting to host $destinationIP, port 1701
  kernel: l2tp_ppp: PPPoL2TP kernel driver, V2.0
  NetworkManager[39768]: xl2tpd[39768]: Connection established to $destinationIP, 1701.  Local: 39853, Remote: 1 (ref=0/0).
  NetworkManager[39768]: xl2tpd[39768]: Calling on tunnel 39853
  NetworkManager[39768]: xl2tpd[39768]: Call established with $destinationIP, Local: 6356, Remote: 1, Serial: 1 (ref=0/0)
  NetworkManager[39768]: xl2tpd[39768]: start_pppd: I'm running:
  NetworkManager[39768]: xl2tpd[39768]: "/usr/sbin/pppd"
  NetworkManager[39768]: xl2tpd[39768]: "plugin"
  NetworkManager[39768]: xl2tpd[39768]: "pppol2tp.so"
  NetworkManager[39768]: xl2tpd[39768]: "pppol2tp"
  NetworkManager[39768]: xl2tpd[39768]: "7"
  NetworkManager[39768]: xl2tpd[39768]: "passive"
  NetworkManager[39768]: xl2tpd[39768]: "nodetach"
  NetworkManager[39768]: xl2tpd[39768]: ":"
  NetworkManager[39768]: xl2tpd[39768]: "file"
  NetworkManager[39768]: xl2tpd[39768]: "/var/run/nm-l2tp-114514/ppp-options"
  pppd[39773]: Plugin pppol2tp.so loaded.
  pppd[39773]: Plugin /usr/lib/pppd/2.4.9/nm-l2tp-pppd-plugin.so loaded.
  pppd[39773]: pppd 2.4.9 started by root, uid 0
  pppd[39773]: Using interface ppp0
  pppd[39773]: Connect: ppp0 <-->
  pppd[39773]: Overriding mtu 1500 to 1400
  pppd[39773]: Overriding mru 1500 to mtu value 1400
  systemd-udevd[39745]: Using default interface naming scheme 'v250'.
  NetworkManager[621]: <info>  [1145.141919] manager: (ppp0): new Ppp device (/org/freedesktop/NetworkManager/Devices/10)
  pppd[39773]: Overriding mtu 1500 to 1400
  pppd[39773]: PAP authentication succeeded
  charon[39715]: 10[KNL] $vpnInnerIP appeared on ppp0
  charon-systemd[744]: $vpnInnerIP appeared on ppp0
  charon[39715]: 07[KNL] $vpnInnerIP disappeared from ppp0
  charon-systemd[744]: $vpnInnerIP disappeared from ppp0
  charon[39715]: 14[KNL] $vpnInnerIP appeared on ppp0
  charon-systemd[744]: $vpnInnerIP appeared on ppp0
  charon[39715]: 15[KNL] interface ppp0 activated
  charon-systemd[744]: interface ppp0 activated
  pppd[39773]: Cannot determine ethernet address for proxy ARP
  pppd[39773]: local  IP address $vpnInnerIP
  pppd[39773]: remote IP address $remoteIP
  pppd[39773]: primary   DNS address $dnsAddress
```

在这之中 找到了 pppd  xl2tpd nm-l2tp-service 这几个玩意 大概就是这些了吧

然后试试将这几个软件加进去 config.json 的 program_noproxy 栏里面：

```shell
sudo nano /etc/cgproxy/config.json
```

------


```
{
    "comment":"For usage, see https://github.com/springzfx/cgproxy",

    "port": 12345,
    "program_noproxy": ["v2ray", "qv2ray", "nm-l2tp-service", "xl2tpd", "pppd" ],
    "program_proxy": [],
    "cgroup_noproxy": ["/system.slice/v2ray.service"],
    "cgroup_proxy": ["/"],
    "enable_gateway": ture,
    "enable_dns": true,
    "enable_udp": true,
    "enable_tcp": true,
    "enable_ipv4": true,
    "enable_ipv6": true,
    "table": 10007,
    "fwmark": 39283
}

```

不要照抄咱的config 请按照自己的情况判断

保存后重启 cgproxy.service:

```shell
sudo systemctl restart cgproxy.service
```

~~然后再测试一下，噔噔！好了！OwO~~ 好个鬼头 原来是忘记检查一遍config  多打了一个逗号直接 core dump了（

再仔细看看还有什么问题（（（



## 最终解决方法

还是先用回  [一开始的那个用法](#分析与解决)吧（
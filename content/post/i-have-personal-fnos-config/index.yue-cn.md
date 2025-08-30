---
title: "我嘅 FnOS 私家配置同贴士"
date: 2025-08-08T11:26:29+08:00
draft: false
categories:
- Linux
- 网络
- 虚拟化
tags:
- Proxmox VE
- PVE
- FnOS
- NAS
- IPv6
- UDEV
- 热插拔

description:
  飞牛OS用落几好用，但我觉得仲有得搞搞佢。呢篇文章系我用嗰阵嘅一啲总结，当系抛砖引玉，欢迎大家多多指教。
---


本文专注于[飞牛OS](https://www.fnnas.com/)使用时嘅优化。如果想知点样喺 PVE 或者实体机度装飞牛OS，可以睇返[上一篇文章](../喺-proxmox-ve-pve-上面装-fnos)。

## 网络优化

下面呢啲步骤可以提高网络吞吐量同保障私隐。

1.  行呢个 script 嚟开 BBR 拥塞控制算法:

    ```shell
    cat > /etc/sysctl.d/99-enable-bbr.conf <<EOF
    net.core.default_qdisc=fq
    net.ipv4.tcp_congestion_control=bbr
    EOF
    ```

2.  唔使重启就可以应用BBR配置：
    ```shell
    sysctl -p /etc/sysctl.d/99-enable-bbr.conf
    ```

3.  行呢个脚本嚟开最新嘅 IPv6 私隐地址标准（RFC 7217 同 RFC 4941）：
    ```shell
    cat > /etc/sysctl.d/99-enable-private-ipv6.conf <<EOF
    net.ipv6.conf.all.use_tempaddr = 2
    net.ipv6.conf.default.use_tempaddr = 2
    net.ipv6.conf.all.addr_gen_mode=1
    net.ipv6.conf.default.addr_gen_mode=1
    EOF
    ```

4.  应用sysctl配置：
    ```shell
    sysctl -p /etc/sysctl.d/99-enable-private-ipv6.conf
    ```

    > 🚨 **警告**：唔好喺 FnOS Web 介面用“EUI-64”呢个选项。咁做会喺 IPv6 地址度**暴露设备嘅 MAC 地址，搞到啲私隐增强功能冇晒用**。

5.  **应用网络变更**

    要启用新嘅 IPv6 地址设定，就要重置个网络接口。用 `nmcli` 就搞得掂，唔使成个系统重启。

    > **🚨 重要提示**：喺 PVE Web 控制台 (`Xterm.js`) 度行呢啲命令，因为如果用 SSH 行，**IPv6 地址一变就会断线**，而且可能连唔返。

    **步骤 1：搵出连接个名**
    列晒所有连紧嘅连接，搵主接口个名。

    ```shell
    nmcli connection show
    ```
    输出会列出可以用嘅连接。记低你个以太网连接嘅名，通常系 `Wired connection 1`。

    **步骤 2：重置连接**
    用啱啱搵到嘅名嚟重启网络接口：

    ```shell
    nmcli connection down "Wired connection 1" && nmcli connection up "Wired connection 1"
    ```
    网络接口会重启。你可以用 `ip a` 或者喺 PVE Web 控制台嘅虚拟机 `Summary` 页面度确认新嘅 IPv6 地址配置。

6.  **为咗俾虚拟机用，要开 IPv6 路由通告（RA）**

    要俾佢入面啲虚拟机都可以透过 SLAAC 攞到 IPv6，就要改佢个 RA 设定：
    
    ```shell
    cat > /etc/sysctl.d/99-virtual-machine.conf <<EOF
    net.ipv6.conf.all.accept_ra = 2
    net.ipv6.conf.default.accept_ra = 2
    EOF
    
    sysctl -p /etc/sysctl.d/99-virtual-machine.conf
    ```



## 做 PVE/QEMU 客户机嗰阵点样开内存同CPU热插拔

1. 改 `/etc/default/grub` 嚟开内存热插拔:
   ```diff
   - GRUB_CMDLINE_LINUX="modprobe.blacklist=pcspkr"
   + GRUB_CMDLINE_LINUX="modprobe.blacklist=pcspkr memhp_default_state=online"
   ```
   
2. 整个 UDEV 规则嚟开 CPU 热插拔：
   ```shell
   cat > /lib/udev/rules.d/80-hotplug-cpu.rules <<EOF
   SUBSYSTEM=="cpu", ACTION=="add", TEST=="online", ATTR{online}=="0", ATTR{online}="1"
   EOF
   ```

3. 熄咗部虚拟机。

4. 喺 PVE 网页控制台嘅处理器页面度拣 “启用 NUMA”。

5. 喺 PVE 网页控制台嘅选项页面，“热插拔”选项列表度拣`内存`同`CPU`。
---
title: "我有特别的 FnOS 配置和使用技巧"
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
  飞牛OS使用下来非常好用，但我觉得还是有更多优化空间。这篇文章是我使用时的一些总结，仅作抛砖引玉之用，请各位不吝赐教。
---



本文专注于[飞牛OS](https://www.fnnas.com/)使用时的优化。如需查看如何在 PVE 或实体机器安装飞牛OS，请看[上一篇文章](../在-proxmox-ve-pve-上安装-fnos)。

## 网络优化

以下可选步骤可提高网络吞吐量和隐私。

1.  执行此脚本以启用 BBR 拥塞控制算法:

    ```shell
    cat > /etc/sysctl.d/99-enable-bbr.conf <<EOF
    net.core.default_qdisc=fq
    net.ipv4.tcp_congestion_control=bbr
    EOF
    ```

2.  无需重启即可应用BBR配置：
    ```shell
    sysctl -p /etc/sysctl.d/99-enable-bbr.conf
    ```

3.  执行此脚本以启用现代 IPv6 隐私地址标准（RFC 7217 和 RFC 4941）：
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

    > 🚨 **警告**：请不要在 FnOS Web 界面中使用“EUI-64”选项。这样做会通过在其 IPv6 地址中**暴露设备的 MAC 地址使这些隐私增强功能失效**。

5.  **应用网络更改**

    要激活新的 IPv6 地址设置，必须重置网络接口。这可以通过 `nmcli` 完成，而无需完全系统重启。

    > **🚨 重要提示**：从 PVE Web 控制台 (`Xterm.js`) 执行这些命令，因为通过 SSH 运行**会因为IPv6地址改变导致连线断开**，且可能无法恢复。

    **步骤 1：识别连接名称**
    列出所有活动连接以找到主接口的名称。

    ```shell
    nmcli connection show
    ```
    输出将列出可用的连接。记下您的以太网连接的名称，通常是 `Wired connection 1`。

    **步骤 2：重置连接**
    使用识别出的名称重新启动网络接口：

    ```shell
    nmcli connection down "Wired connection 1" && nmcli connection up "Wired connection 1"
    ```
    网络接口将重新启动。您可以使用 `ip a` 或者在 PVE Web 控制台中虚拟机的 `Summary` 页面中确认新的 IPv6 地址配置。

6.  **启用作为虚拟机宿主机的 IPv6 路由通告（RA）**

    要使其内部的虚拟机也能透过 SLAAC 获取 IPv6，需要更改其 RA 设定：
    
    ```shell
    cat > /etc/sysctl.d/99-virtual-machine.conf <<EOF
    net.ipv6.conf.all.accept_ra = 2
    net.ipv6.conf.default.accept_ra = 2
    EOF
    
    sysctl -p /etc/sysctl.d/99-virtual-machine.conf
    ```



## 作为 PVE/QEMU 客户机时启用内存与CPU热插拔

1. 修改 `/etc/default/grub` 以启用内存热插拔:
   ```diff
   - GRUB_CMDLINE_LINUX="modprobe.blacklist=pcspkr"
   + GRUB_CMDLINE_LINUX="modprobe.blacklist=pcspkr memhp_default_state=online"
   ```
   
2. 创建 UDEV 规则以启用 CPU 热插拔：
   ```shell
   cat > /lib/udev/rules.d/80-hotplug-cpu.rules <<EOF
   SUBSYSTEM=="cpu", ACTION=="add", TEST=="online", ATTR{online}=="0", ATTR{online}="1"
   EOF
   ```

3. 关闭虚拟机。

4. 在 PVE 网页控制台的处理器页面中勾选 「启用 NUMA」。

5. 在 PVE 网页控制台的选项页面的「热插拔」选项列表中勾选`内存`与`CPU`。

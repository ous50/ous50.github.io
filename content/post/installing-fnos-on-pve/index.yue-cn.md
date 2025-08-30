---
title: 喺 Proxmox VE (PVE) 上面装 FnOS
date: 2025-08-03T10:12:00+08:00
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

lang: yue-CN
description:
  呢份指南详细介绍咗点样喺 Proxmox VE（喺 PVE 8 上面测试过）度装 FnOS，仲提供咗关键嘅安装后配置，确保功能同性能冇问题。
---

## 简介

呢份文件解决咗喺 PVE 环境装完 FnOS 之后成日撞到嘅问题，例如系统锁咗同 PVE Web 控制台冇反应。跟住呢啲步骤做，你就会有一个可以完全访问、安全又优化好嘅 FnOS 虚拟机。

如果你已经装好，想睇多啲优化技巧，可以睇[呢一篇文章](../我嘅-fnos-私家配置同贴士)。

## 安装准备

FnOS ISO：去 https://www.fnnas.com/ 透过“直接下载”攞到。

建议 PVE 起码要有 3GB RAM 同 2 个核心。

跟住[官方指南](https://help.fnnas.com/articles/fnosV1/start/install-os.md)嚟装系统。

---

## 安装后配置

第一次开机嗰阵，有两个大问题会搞到你入唔到新嘅 FnOS 实例：

1.  **禁止登入**：喺搞掂 Web 初始设定之前，系统控制台唔食任何密码（包括 `root`）。呢个对于可能得 IPv6 访问嘅远程机器嚟讲系个问题。
2.  **PVE 控制台冇反应**：PVE Web UI 入面个 `Xterm.js` 串行控制台預設係用唔到嘅。

下面呢几部分提供咗呢啲问题嘅解决方案。

### 获取初始 root 访问权限

首先，我哋要兜过标准嘅启动程序嚟设定 root 密码。

1.  喺 PVE 控制台度，重啟部虚拟机。喺 GRUB 启动菜单，㩒 `e` 嚟编辑启动参数。
2.  搵到用 `linux` 开头嗰行。佢睇落会系咁样：
    ```
    linux /boot/vmlinuz-6.12.18-trim root=UUID=... ro quiet
    ```
3.  喺呢行嘅最尾加 `single init=/bin/bash`。呢个参数会直接将系统带到 root shell。
4.  㩒 `Ctrl+X` 或者 `F10` 启动。
5.  喺 root shell 度，行 `passwd` 命令帮 `root` 用户整个新密码。
6.  搞掂之后，重啟部虚拟机。头先改嘅启动参数系临时嘅，唔会保存。

### 启用永久控制台访问和功能

搞掂 root 访问权限之后，就永久修改 GRUB 配置嚟开 PVE 串行控制台同其他功能。

1.  用新设嘅密码以 `root` 身份登入。
2.  编辑 GRUB 配置文件：`nano /etc/default/grub`。
3.  修改 `GRUB_CMDLINE_LINUX_DEFAULT` 呢行，加返串行控制台同埋可选嘅嵌套虚拟化 IOMMU 支持。

    **如果系 Intel CPU：**
    ```diff
    - GRUB_CMDLINE_LINUX_DEFAULT="quiet"
    + GRUB_CMDLINE_LINUX_DEFAULT="quiet console=tty0 console=ttyS0,115200 intel_iommu=on iommu=pt"
    ```
    **如果系 AMD CPU：**
    ```diff
    - GRUB_CMDLINE_LINUX_DEFAULT="quiet"
    + GRUB_CMDLINE_LINUX_DEFAULT="quiet console=tty0 console=ttyS0,115200 amd_iommu=on iommu=pt"
    ```
    > **注意：** `console=ttyS0,115200` 系 PVE `Xterm.js` 功能嘅关键参数。

4.  保存修改然后退出编辑器。
5.  行下面呢个命令嚟应用新配置：
    ```shell
    update-grub
    ```
6.  重啟部虚拟机。而家 PVE Web 控制台应该就完全正常啦。

### 安装 QEMU 客户机代理

为咗更好咁同 PVE 整合，例如喺虚拟机摘要度显示网络信息，我哋要装`qemu-guest-agent`。

    ```shell
    apt update && apt -y install qemu-guest-agent
    systemctl enable --now qemu-guest-agent
    ```


## 结语

咁样你就已经成功喺 Proxmox VE 上面配置好 FnOS 实例。个系统而家可以完全访问，并且同 PVE 主机正确整合。之后嘅配置同优化我会喺[新嘅一篇文章](../我嘅-fnos-私家配置同贴士)度讲。
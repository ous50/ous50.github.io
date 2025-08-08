---
title: 在 Proxmox VE (PVE) 上安装 FnOS
date: 2025-08-03 10:12:00
lastmod: 2025-08-08 17:00:00
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

lang: zh-CN
description:
  本指南详细介绍了如何在 Proxmox VE（在 PVE 12 上测试）上安装 FnOS，并提供了关键的安装后配置，以确保功能和性能。
---

## 简介

本文档解决了在 PVE 环境中安装 FnOS 后遇到的常见问题，例如系统被锁定和 PVE Web 控制台无响应。通过遵循这些步骤，您将获得一个完全可访问、安全且优化的 FnOS 虚拟机。

如果您已经安装完毕，并想查看更多优化技巧，请看[这一篇文章](../我有特别的-fnos-配置和使用技巧)

## 安装准备

FnOS ISO：访问 https://www.fnnas.com/ 并通过“直接下载”获取。

建议 PVE 至少具有 3GB RAM 和 2 核。

按照[官方指南](https://help.fnnas.com/articles/fnosV1/start/install-os.md)安装系统。

---

## 安装后配置

首次启动时，有两个主要问题会阻止访问新的 FnOS 实例：

1.  **登录禁用**：在完成基于 Web 的初始设置之前，系统控制台不接受任何凭据（包括 `root`）。这对于可能只有 IPv6 访问权限的远程机器来说是个问题。
2.  **PVE 控制台无响应**：PVE Web UI 中的 `Xterm.js` 串行控制台默认情况下无法工作。

以下部分提供了这些问题的解决方案。

### 1. 获取初始 root 访问权限

首先，我们必须绕过标准启动序列来设置 root 密码。

1.  在 PVE 控制台中，重启虚拟机。在 GRUB 启动菜单中，按 `e` 编辑启动参数。
2.  找到以 `linux` 开头的行。它将类似于以下内容：
    ```
    linux /boot/vmlinuz-6.12.18-trim root=UUID=... ro quiet
    ```
3.  在此行末尾添加 `single init=/bin/bash`。此参数将系统直接引导到 root shell。
4.  按 `Ctrl+X` 或 `F10` 启动。
5.  在 root shell 中，执行 `passwd` 命令为 `root` 用户设置新密码。
6.  完成后，重启虚拟机。引导参数更改是临时的，不会持久化。

### 2. 启用永久控制台访问和功能

建立 root 访问权限后，永久修改 GRUB 配置以启用 PVE 串行控制台和其他功能。

1.  使用新设置的密码以 `root` 身份登录。
2.  编辑 GRUB 配置文件：`nano /etc/default/grub`。
3.  修改 `GRUB_CMDLINE_LINUX_DEFAULT` 行，以包含串行控制台和可选的嵌套虚拟化 IOMMU 支持。

    **对于 Intel CPU：**
    ```diff
    - GRUB_CMDLINE_LINUX_DEFAULT="quiet"
    + GRUB_CMDLINE_LINUX_DEFAULT="quiet console=tty0 console=ttyS0,115200 intel_iommu=on iommu=pt"
    ```
    **对于 AMD CPU：**
    ```diff
    - GRUB_CMDLINE_LINUX_DEFAULT="quiet"
    + GRUB_CMDLINE_LINUX_DEFAULT="quiet console=tty0 console=ttyS0,115200 amd_iommu=on iommu=pt"
    ```
    > **注意：** `console=ttyS0,115200` 是 PVE `Xterm.js` 功能的关键参数。

4.  保存更改并退出编辑器。
5.  通过执行以下命令应用新配置：
    ```shell
    update-grub
    ```
6.  重启虚拟机。PVE Web 控制台现在应该完全正常工作。

### 3. 安装 QEMU 客户机代理

为了更好地与 PVE 集成，例如在虚拟机摘要中显示网络信息，我们需要安装`qemu-guest-agent`。

    ```shell
    apt update && apt -y install qemu-guest-agent
    systemctl enable --now qemu-guest-agent
    ```


## 结语

您已成功在 Proxmox VE 上配置了 FnOS 实例。系统现在完全可访问，并与 PVE 主机正确集成。后续配置与优化我将在[新的一篇文章](../我有特别的-fnos-配置和使用技巧)展现。
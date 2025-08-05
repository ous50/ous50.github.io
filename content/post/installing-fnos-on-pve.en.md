---
title: Installing FnOS on Proxmox VE (PVE)
date: 2025-08-03 10:12:00
lastmod: 2025-08-05 12:00:00
draft: false
categories:
- Linux
- Networking
tags:
- Proxmox VE
- PVE
- FnOS
- NAS
- IPv6

lang: en
description:
  This guide details the installation of FnOS on Proxmox VE (tested on PVE 12) and provides critical post-installation configurations to ensure functionality and performance.
---

# Installing FnOS on Proxmox VE (PVE)

**Last Updated**: August 4, 2025
**Scope**: This guide details the installation of FnOS on Proxmox VE (tested on PVE 12) and provides critical post-installation configurations to ensure functionality and performance.

## Introduction

This document addresses common challenges encountered after installing FnOS in a PVE environment, such as being locked out of the system and the PVE web console being unresponsive. By following these steps, you will achieve a fully accessible, secure, and optimized FnOS virtual machine.

## Prerequisites

FnOS ISO: Go to https://www.fnnas.com/ and download via "Direct download".

PVE with at least 3GB RAM and 2 cores are recommended .

Just follow [official guide](https://help.fnnas.com/articles/fnosV1/start/install-os.md) to install the system.

---

## Post-Installation Configuration

Upon first boot, two primary issues prevent access to the new FnOS instance:

1.  **Login Disabled**: The system console will not accept any credentials (including `root`) until the web-based initial setup is complete. This is problematic for remote machines that may only have IPv6 access.
2.  **PVE Console Unresponsive**: The `Xterm.js` serial console in the PVE web UI remains non-functional by default.

The following sections provide solutions to these problems.

### 1. Gaining Initial Root Access

To begin, we must bypass the standard boot sequence to set a root password.

1.  From the PVE console, reboot the VM. At the GRUB boot menu, press `e` to edit the boot parameters.
2.  Locate the line beginning with `linux`. It will resemble the following:
    ```
    linux /boot/vmlinuz-6.12.18-trim root=UUID=... ro quiet
    ```
3.  Append `single init=/bin/bash` to the end of this line. This parameter boots the system directly into a root shell.
4.  Press `Ctrl+X` or `F10` to boot.
5.  In the root shell, execute the `passwd` command to set a new password for the `root` user.
6.  Once complete, reboot the VM. The boot parameter change was temporary and will not persist.

### 2. Enabling Permanent Console Access and Features

With root access established, permanently modify the GRUB configuration to enable the PVE serial console and other features.

1.  Log in as `root` using the newly set password.
2.  Edit the GRUB configuration file: `nano /etc/default/grub`.
3.  Modify the `GRUB_CMDLINE_LINUX_DEFAULT` line to include the serial console and optional IOMMU support for nested virtualization.

    **For Intel CPUs:**
    ```diff
    - GRUB_CMDLINE_LINUX_DEFAULT="quiet"
    + GRUB_CMDLINE_LINUX_DEFAULT="quiet console=tty0 console=ttyS0,115200 intel_iommu=on iommu=pt"
    ```
    **For AMD CPUs:**
    ```diff
    - GRUB_CMDLINE_LINUX_DEFAULT="quiet"
    + GRUB_CMDLINE_LINUX_DEFAULT="quiet console=tty0 console=ttyS0,115200 amd_iommu=on iommu=pt"
    ```
    > **Note:** `console=ttyS0,115200` is the critical parameter for PVE `Xterm.js` functionality.

4.  Save the changes and exit the editor.
5.  Apply the new configuration by executing:
    ```shell
    update-grub
    ```
6.  Reboot the VM. The PVE web console should now be fully functional.

### 3. Installing the QEMU Guest Agent

For improved integration with PVE, such as displaying network information in the VM summary, install the guest agent.

```shell
apt update && apt -y install qemu-guest-agent
systemctl enable --now qemu-guest-agent
```

### 4. Network Optimization

The following optional steps enhance network throughput and privacy.

1.  Execute this script to enable the BBR congestion control algorithm and modern IPv6 privacy address standards (RFC 7217 & RFC 4941).

    ```shell
    # Ensure BBR module is loaded on boot
    echo "tcp_bbr" > /etc/modules-load.d/modules.conf

    # Create a new sysctl configuration file for custom network settings
    cat > /etc/sysctl.d/99-custom-network.conf <<EOF
    fs.fanotify.max_queued_events=65536
    fs.inotify.max_user_watches=216508
    net.core.default_qdisc=fq
    net.ipv4.tcp_congestion_control=bbr
    net.ipv6.conf.all.use_tempaddr = 2
    net.ipv6.conf.default.use_tempaddr = 2
    net.ipv6.conf.all.addr_gen_mode=1
    net.ipv6.conf.default.addr_gen_mode=1
    EOF
    ```

2.  Apply the new kernel parameters without rebooting:
    ```shell
    sysctl -p /etc/sysctl.d/99-custom-network.conf
    ```
    > 🚨 **Warning**: After enabling these settings, do not use the "EUI-64" option in the FnOS web interface. Doing so will **override these privacy enhancements by exposing the device's MAC address** in its IPv6 address.

3.  **Applying Network Changes without Rebooting**

    To activate the new IPv6 address settings, the network interface must be reset. This can be done via `nmcli` without a full system reboot.

    > **🚨 Important**: Execute these commands from the PVE web console (`Xterm.js`), as running them over SSH will **cause a temporary disconnection that may not recover**.

    **Step 1: Identify the Connection Name**
    List all active connections to find the name of the primary interface.
    ```shell
    nmcli connection show
    ```
    The output will list available connections. Note the name of your ethernet connection, typically `Wired connection 1`.

    **Step 2: Reset the Connection**
    Use the identified name to restart the connection.
    ```shell
    nmcli connection down "Wired connection 1" && nmcli connection up "Wired connection 1"
    ```
    The network interface will restart. You can confirm the new IPv6 address configuration with `ip a` or at the `Summary` tab in the PVE web console.

## Conclusion

You have successfully configured a FnOS instance on Proxmox VE. The system is now fully accessible, properly integrated with the PVE host, and optimized for both network performance and user privacy.
---
title: "Installing FnOS on Proxmox VE (PVE)"
date: 2025-08-03 10:12:00
lastmod: 2025-08-08 17:00:00
draft: false
categories:
- Linux
- Networking
- Virtualization
tags:
- Proxmox VE
- PVE
- FnOS
- NAS
- IPv6
lang: en-US
description:
  This guide details how to install FnOS on Proxmox VE (tested on PVE 12) and provides key post-installation configurations to ensure functionality and performance.
---
## Introduction

This document addresses common issues encountered on the process of **installing FnOS in a PVE environment**, such as a locked system and an unresponsive PVE web console. By following these steps, you will achieve a fully accessible, secure, and optimized FnOS virtual machine.

If you have already **completed the installation and want to see more optimization tips**, please see [this article](../advanced-fnos-configuration-and-usage-tips/).

## Pre-Installation

**FnOS ISO**: Visit https://www.fnnas.com/ and obtain it via “Direct Download”.

It is recommended that the FnOS VM has at least 3GB of RAM and 2 cores.

Follow the [official guide](https://help.fnnas.com/articles/fnosV1/start/install-os.md) to install the system.

---

## Post-Installation Configuration

On the first boot, two primary issues prevent access to the new FnOS instance:

1.  **Login Disabled**: The system console does not accept any credentials (including `root`) until the web-based initial setup is complete. This is problematic for remote machines that may only have IPv6 access.
2.  **Unresponsive PVE Console**: The `Xterm.js` serial console in the PVE web UI does not work by default.

The following sections provide solutions to these problems.

### 1. Gaining Initial Root Access

First, we must bypass the standard boot sequence to set a root password.

1.  In the PVE console, restart the VM. At the GRUB boot menu, press `e` to edit the boot parameters.
2.  Find the line that begins with `linux`. It will look similar to this:
    ```
    linux /boot/vmlinuz-6.12.18-trim root=UUID=... ro quiet
    ```
3.  At the end of this line, add `single init=/bin/bash`. This parameter boots the system directly into a root shell.
4.  Press `Ctrl+X` or `F10` to boot.
5.  In the root shell, execute the `passwd` command to set a new password for the `root` user.
6.  Once done, reboot the VM. The boot parameter change is temporary and will not persist.

### 2. Enabling Permanent Console Access and Functionality

With root access established, permanently modify the GRUB configuration to enable the PVE serial console and other features.

1.  Log in as `root` with the newly set password.
2.  Edit the GRUB configuration file: `nano /etc/default/grub`.
3.  Modify the `GRUB_CMDLINE_LINUX_DEFAULT` line to include serial console and optional nested virtualization IOMMU support.

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
    > **Note:** `console=ttyS0,115200` is the key parameter for PVE `Xterm.js` functionality.

4.  Save the changes and exit the editor.
5.  Apply the new configuration by executing:
    ```shell
    update-grub
    ```
6.  Reboot the VM. The PVE web console should now be fully functional.

### 3. Installing the QEMU Guest Agent

For better integration with PVE, such as displaying network information in the VM summary, we need to install the `qemu-guest-agent`.

    ```shell
    apt update && apt -y install qemu-guest-agent
    systemctl enable --now qemu-guest-agent
    ```

## Conclusion

You have successfully configured an FnOS instance on Proxmox VE. The system is now fully accessible and properly integrated with the PVE host. **Further configurations and optimizations will be presented** in a [new article](../advanced-fnos-configuration-and-usage-tips/).
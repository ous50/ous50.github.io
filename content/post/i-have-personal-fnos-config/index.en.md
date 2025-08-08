---
title: "Advanced FnOS Configuration and Usage Tips"
date: 2025-08-08T11:26:29+08:00
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
- UDEV
- Hot-plug
description:
  FnOS is excellent, but it can be optimized further. This article shares my tips and configurations as a starting point for discussion. Feedback is welcome.
---

This article focuses on optimizing [FnOS](https://www.fnnas.com/). For instructions on installing FnOS on PVE or a physical machine, please see the [previous article](../installing-fnos-on-proxmox-ve-pve/).

## Network Optimization

The following optional steps can improve network throughput and privacy.

1.  Execute this script to enable the BBR congestion control algorithm:

    ```shell
    cat > /etc/sysctl.d/99-enable-bbr.conf <<EOF
    net.core.default_qdisc=fq
    net.ipv4.tcp_congestion_control=bbr
    EOF
    ```

2.  Apply the BBR configuration without rebooting:
    ```shell
    sysctl -p /etc/sysctl.d/99-enable-bbr.conf
    ```

3.  Execute this script to enable modern IPv6 privacy address standards (RFC 7217 and RFC 4941):
    ```shell
    cat > /etc/sysctl.d/99-enable-private-ipv6.conf <<EOF
    net.ipv6.conf.all.use_tempaddr = 2
    net.ipv6.conf.default.use_tempaddr = 2
    net.ipv6.conf.all.addr_gen_mode=1
    net.ipv6.conf.default.addr_gen_mode=1
    EOF
    ```

4.  Apply the sysctl configuration:
    ```shell
    sysctl -p /etc/sysctl.d/99-enable-private-ipv6.conf
    ```

    > 🚨 **Warning**: Do not use the “EUI-64” option in the FnOS web interface. Doing so will **negate these privacy enhancements by exposing the device’s MAC address** in its IPv6 address.

5.  **Applying Network Changes**

    To activate the new IPv6 address settings, the network interface must be reset. This can be done with `nmcli` without a full system reboot.

    > **🚨 Important**: Execute these commands from the PVE web console (`Xterm.js`), as running them over SSH **will cause a disconnection due to the IPv6 address change** and may not be recoverable.

    **Step 1: Identify the Connection Name**
    List all active connections to find the name of your primary interface.

    ```shell
    nmcli connection show
    ```
    The output will list available connections. Note the name of your Ethernet connection, which is often `Wired connection 1`.

    **Step 2: Reset the Connection**
    Use the identified name to restart the network interface:

    ```shell
    nmcli connection down "Wired connection 1" && nmcli connection up "Wired connection 1"
    ```
    The network interface will restart. You can confirm the new IPv6 address configuration using `ip a` or in the `Summary` page for the VM in the PVE web console.

6.  **Enabling IPv6 Router Advertisements (RA) for Hosted Virtual Machines**

    To allow VMs inside it to also acquire IPv6 addresses via SLAAC, its RA settings must be changed:
    
    ```shell
    cat > /etc/sysctl.d/99-virtual-machine.conf <<EOF
    net.ipv6.conf.all.accept_ra = 2
    net.ipv6.conf.default.accept_ra = 2
    EOF
    
    sysctl -p /etc/sysctl.d/99-virtual-machine.conf
    ```

## Enabling Memory and CPU Hot-plug as a PVE/QEMU Guest

1.  Modify `/etc/default/grub` to enable memory hot-plug:
    ```diff
    - GRUB_CMDLINE_LINUX="modprobe.blacklist=pcspkr"
    + GRUB_CMDLINE_LINUX="modprobe.blacklist=pcspkr memhp_default_state=online"
    ```
   
2.  Create a UDEV rule to enable CPU hot-plug:
    ```shell
    cat > /lib/udev/rules.d/80-hotplug-cpu.rules <<EOF
    SUBSYSTEM=="cpu", ACTION=="add", TEST=="online", ATTR{online}=="0", ATTR{online}="1"
    EOF
    ```

3.  Shut down the virtual machine.

4.  In the PVE web console, on the `Processor` page, check "Enable NUMA".

5.  In the PVE web console, on the `Options` page, check `Memory` and `CPU` in the "Hotplug" options list.
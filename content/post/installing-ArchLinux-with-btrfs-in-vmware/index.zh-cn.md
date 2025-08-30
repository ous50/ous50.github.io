---
title: "在 VMware 中安装使用 Btrfs 的 Arch Linux"
date: 2023-01-13T23:07:11+08:00
draft: false
categories:
- Linux
- 软件
- VMware
tags:
- VMware
- Arch
- Btrfs
lang: zh-cn
description:
  一篇关于我在 VMware 中安装 Arch Linux 的记录。
---

## 安装前

首先创建一个虚拟机，并根据你的需求调整相关配置（UEFI 固件部分除外）：

!虚拟机配置概览 [<sup>1</sup>](overview.png)


!固件配置 [<sup>2</sup>](firmwareConfig.png)


为了防止 VMware 创建用于加速的 vmem 文件，[请将以下几行添加到你的 .vmx 配置文件中][1]：

```
prefvmx.minVmMemPct = "100"
MemTrimRate = "0"
mainMem.useNamedFile = "FALSE"
sched.mem.pshare.enable = "FALSE"
prefvmx.useRecommendedLockedMemSize = "TRUE"
```



启动虚拟机，并检查固件是否为 UEFI 模式：

```bash
ls /sys/firmware/efi/efivars
```

如果使用的是传统的 BIOS（Legacy BIOS），该命令会返回 `No such file or directory.`（没有那个文件或目录）。



## 分区

使用 `cgdisk` 或任何你喜欢的其他分区工具，[创建一个新的 GPT 分区表，并分出一个不小于 300MiB 的 EFI 分区][2]和一个 Linux 分区：

```bash
cgdisk /dev/sda
```



### 格式化分区

#### EFI 分区

```bash
mkfs.fat -F32 /dev/sda1
```

#### 根文件系统分区

```bash
mkfs.btrfs -f -L Arch /dev/sda2
```



#### 创建 BTRFS 子卷

- `@`：对应 `/` (根目录)
- `@home`：对应 `/home`
- `@cache`：对应 `/var/cache`
- `@docker`：对应 `/var/lib/docker`
- `@log`：对应 `/var/log`

`@cache` 和 `@log` 子卷不需要启用写时复制（Copy-on-Write, COW）。

1.  将根分区挂载到 `/mnt`：

    ```bash
    mount -t btrfs -o compress=lzo /dev/sda2 /mnt
    ```
    > 通常来说，lzo 压缩算法已经足够好了。有报告显示，即使在 Zstd:1 的压缩级别下，btrfs 的速度也慢得多，而 lzo 与不压缩相比几乎没有性能差异。

2.  创建子卷：

    ```bash
    btrfs subvol create /mnt/@
    btrfs subvol create /mnt/@home
    btrfs subvol create /mnt/@cache
    btrfs subvol create /mnt/@docker
    btrfs subvol create /mnt/@log
    btrfs subvol create /mnt/@tmp
    btrfs subvol create /mnt/@swap
    # 使用 chattr 命令禁用写时复制（COW）
    chattr +C /mnt/@cache
    chattr +C /mnt/@log
    chattr +C /mnt/@swap
    # 卸载分区
    umount /mnt
    ```



#### 挂载分区和子卷

```bash
mount -o noatime,nodiratime,ssd,compress=lzo,subvol=@ /dev/sda2 /mnt
mkdir -p /mnt/{boot/efi,home,var/{log,lib/docker,cache},tmp,swap}
mount -o noatime,nodiratime,ssd,compress=lzo,subvol=@home /dev/sda2 /mnt/home
mount -o noatime,nodiratime,ssd,compress=lzo,subvol=@log /dev/sda2 /mnt/var/log
mount -o noatime,nodiratime,ssd,compress=lzo,subvol=@docker /dev/sda2 /mnt/var/lib/docker
mount -o noatime,nodiratime,ssd,compress=lzo,subvol=@cache /dev/sda2 /mnt/var/cache
mount -o noatime,nodiratime,ssd,compress=lzo,subvol=@tmp /dev/sda2 /mnt/tmp
mount -o noatime,nodiratime,ssd,compress=lzo,subvol=@swap /dev/sda2 /mnt/swap
```



#### 挂载 EFI 分区：

```bash
mount /dev/sda1 /mnt/boot/EFI
```



### 安装系统

```bash
pacstrap /mnt base base-devel linux linux-firmware btrfs-progs networkmanager dhcpcd iwd vim sudo zsh zsh-completions {intel,amd}-ucode net-tools linux-headers curl git wget 
```



### 生成 fstab

```bash
genfstab -U /mnt > /mnt/etc/fstab
```

生成后请仔细检查文件内容，然后继续进行安装后的配置。



## 安装后配置

```bash
arch-chroot /mnt	
```



### 为 pacman 设置镜像源

使用 reflector 或直接更新 `/etc/pacman.d/mirrorlist` 文件，然后通过 `pacman -Syy` 应用更改。



### 安装引导加载程序

本文使用 grub 作为引导加载程序，因为它是少数能很好地支持 btrfs 的引导程序之一。

```bash
pacman -S grub efibootmgr os-prober
```



```bash
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=Arch
```

成功安装后会显示如下结果。

!grub 安装成功结果 [<sup>3</sup>](./grubInstallSuccessfulResult.png)



接下来进行一些优化。提高日志级别并添加 `nowatchdog` 参数以加快开机和关机速度：

```bash
nano /etc/default/grub
```

并编辑如下：

```diff
- GRUB_CMDLINE_LINUX_DEFAULT="loglevel=5"
+ GRUB_CMDLINE_LINUX_DEFAULT="loglevel=5 nowatchdog"
```

保存文件，然后生成新的 grub 配置文件以应用更改。

```bash
[root@archiso /] # grub-mkconfig -o /boot/grub/grub.cfg
正在生成 grub 配置文件 ...
找到 Linux 镜像：/boot/vmlinuz-linux
找到 initrd 镜像：/boot/intel-ucode.img /boot/amd-ucode.img /boot/initramfs-linux.img
在 /boot 中找到备用的 initrd 镜像：
intel-ucode.img amd-ucode.img initramfs-linux-fallback.img
警告：os-prober 不会被执行以检测其他可引导的分区。
这些系统上的分区将不会被添加到 GRUB 启动菜单中。
请查阅相关文档。
为 UEFI 固件设置添加启动菜单项 ...
完成
```



### 设置主机名和 hosts 文件

```bash
newHostname="你的新主机名"
echo $newHostname > /etc/hostname
echo -e "127.0.0.1   localhost\n::1         localhost\n127.0.1.1   $newHostname.localdomain $newHostname" >> /etc/hosts
```



### 设置时区

```bash
ln -sf /usr/share/zoneinfo/Asia/Hong_Kong /etc/localtime
```



### 设置区域与语言

```bash
nano /etc/locale.gen
```

取消注释 `en-US.UTF-8 UTF-8` 以及任何你想使用的其他区域设置，然后生成 locale 文件并设置默认语言为美式英语：

```bash
locale-gen && echo 'LANG=en_US.UTF-8'  > /etc/locale.conf
```



### 设置用户账户

首先设置 root 账户的密码：

```bash
passwd root	
```



```bash
yourName="example"
useradd -m $yourName && echo "为用户 $yourName 设置新密码" && passwd $yourName
```



### 桌面环境

本文中我们安装 [KDE](https://wiki.archlinux.org/title/KDE)：

```bash
pacman -S plasma plasma-wayland-session egl-wayland kde-{accessibility,graphics,multimedia,network,pim,sdk,system,utilities}-meta
```



### VMware Tools

官方的 VMware Tools 不支持 Arch Linux。通常使用 OpenVMTools。

使用 Open VM Tools 可能无法正常调整屏幕分辨率。这里有一个根据 [reddit 帖子][3] 提供的解决方案：

```shell
sudo pacman -Syu
sudo pacman -S open-vm-tools
sudo pacman -Su xf86-input-vmmouse xf86-video-vmware mesa gtk2 gtkmm
echo needs_root_rights=yes | sudo tee /etc/X11/Xwrapper.config
sudo systemctl enable --now vmtoolsd
```

这样就可以了。



### 参考资料：

[1]: https://gist.github.com/extremecoders-re/cf8d829c108d58bfbb2e3c1f4121d7e1 "禁用 vmem 文件创建。"

[2]: https://wiki.archlinux.org/title/Installation_guide#Example_layouts "分区布局"
[3]: https://www.reddit.com/r/archlinux/comments/b0ona0/vmtools_on_arch_linux_full_screen_or_resizing/ "vmware tools 指南"

https://blog.zrlab.org/posts/arch-btrfs

https://wiki.archwiki.org

https://ericclose.github.io/Installing-Arch-as-a-guest-with-UEFI-and-GPT.html

https://arch.icekylin.online/rookie/basic-install.html

https://www.reddit.com/r/archlinux/comments/b0ona0/vmtools_on_arch_linux_full_screen_or_resizing/
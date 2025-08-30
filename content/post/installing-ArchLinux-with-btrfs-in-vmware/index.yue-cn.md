---
title: "喺 VMware 度安装用 Btrfs 嘅 Arch Linux"
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
lang: yue-cn
description:
  一篇关于我喺 VMware 度安装 Arch Linux 嘅记录。
---

## 安装前

首先创建一部虚拟机，跟住根据你嘅需要调整相关配置（UEFI 固件部分除外）：

!虚拟机配置概览 [<sup>1</sup>](overview.png)


!固件配置 [<sup>2</sup>](firmwareConfig.png)


为咗唔俾 VMware 创建用嚟加速嘅 vmem 文件，[请将下边呢几行加到你嘅 .vmx 配置文件度][1]：

```
prefvmx.minVmMemPct = "100"
MemTrimRate = "0"
mainMem.useNamedFile = "FALSE"
sched.mem.pshare.enable = "FALSE"
prefvmx.useRecommendedLockedMemSize = "TRUE"
```



启动虚拟机，然后检查下固件係咪 UEFI 模式：

```bash
ls /sys/firmware/efi/efivars
```

如果用嘅係传统 BIOS（Legacy BIOS），呢个命令会返回 `No such file or directory.`（揾唔到个文件或目录）。



## 硬盘分区

用 `cgdisk` 或者任何你钟意嘅分区工具，[创建一个新嘅 GPT 分区表，再分一个唔细过 300MiB 嘅 EFI 分区][2]同一个 Linux 分区：

```bash
cgdisk /dev/sda
```



### 格式化分区

#### EFI 分区

```bash
mkfs.fat -F32 /dev/sda1
```

#### 根系统分区

```bash
mkfs.btrfs -f -L Arch /dev/sda2
```



#### 创建 BTRFS 子卷

- `@`：对应 `/` (根目录)
- `@home`：对应 `/home`
- `@cache`：对应 `/var/cache`
- `@docker`：对应 `/var/lib/docker`
- `@log`：对应 `/var/log`

`@cache` 同 `@log` 子卷唔需要启用写时复制（Copy-on-Write, COW）。

1.  将根分区挂载到 `/mnt`：

    ```bash
    mount -t btrfs -o compress=lzo /dev/sda2 /mnt
    ```
    > 一般嚟讲，lzo 压缩算法已经够用。有报告话，就算用 Zstd:1 压缩级别，btrfs 嘅速度都慢好多，而 lzo 同唔压缩相比几乎冇性能差别。

2.  创建子卷：

    ```bash
    btrfs subvol create /mnt/@
    btrfs subvol create /mnt/@home
    btrfs subvol create /mnt/@cache
    btrfs subvol create /mnt/@docker
    btrfs subvol create /mnt/@log
    btrfs subvol create /mnt/@tmp
    btrfs subvol create /mnt/@swap
    # 用 chattr 命令禁用写时复制（COW）
    chattr +C /mnt/@cache
    chattr +C /mnt/@log
    chattr +C /mnt/@swap
    # 卸载分区
    umount /mnt
    ```



#### 挂载分区同子卷

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

生成之后请小心检查一次，然后继续搞安装后嘅配置。



## 安装后配置

```bash
arch-chroot /mnt	
```



### 帮 pacman 设置镜像源

用 reflector 或者直接改 `/etc/pacman.d/mirrorlist` 文件，然后行 `pacman -Syy` 嚟应用变更。



### 安装引导程序

呢篇文章用 grub 做引导程序，因为它係少数可以好好咁支持 btrfs 嘅引导程序之一。

```bash
pacman -S grub efibootmgr os-prober
```



```bash
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=Arch
```

成功安装会显示下边嘅结果。

!grub 安装成功结果 [<sup>3</sup>](./grubInstallSuccessfulResult.png)



跟住做啲优化。提高日志级别兼加个 `nowatchdog` 参数，嚟加快开机同关机嘅速度：

```bash
nano /etc/default/grub
```

然后改成咁：

```diff
- GRUB_CMDLINE_LINUX_DEFAULT="loglevel=5"
+ GRUB_CMDLINE_LINUX_DEFAULT="loglevel=5 nowatchdog"
```

保存佢，然后生成新嘅 grub 配置文件嚟应用变更。

```bash
[root@archiso /] # grub-mkconfig -o /boot/grub/grub.cfg
正在生成 grub 配置文件 ...
揾到 Linux 镜像：/boot/vmlinuz-linux
揾到 initrd 镜像：/boot/intel-ucode.img /boot/amd-ucode.img /boot/initramfs-linux.img
喺 /boot 度揾到备用嘅 initrd 镜像：
intel-ucode.img amd-ucode.img initramfs-linux-fallback.img
警告：os-prober 唔会执行去探测其他可引导嘅分区。
嗰啲系统上嘅分区将唔会被加到 GRUB 启动菜单度。
请查阅相关文档。
为 UEFI 固件设置添加启动菜单项 ...
搞掂
```



### 设置主机名同 hosts 文件

```bash
newHostname="你嘅新主机名"
echo $newHostname > /etc/hostname
echo -e "127.0.0.1   localhost\n::1         localhost\n127.0.1.1   $newHostname.localdomain $newHostname" >> /etc/hosts
```



### 设置时区

```bash
ln -sf /usr/share/zoneinfo/Asia/Hong_Kong /etc/localtime
```



### 设置地区同语言

```bash
nano /etc/locale.gen
```

取消注释 `en-US.UTF-8 UTF-8` 同埋任何你想用嘅地区语言，然后生成 locale 文件再设置默认语言做美式英文：

```bash
locale-gen && echo 'LANG=en_US.UTF-8'  > /etc/locale.conf
```



### 设置用户账户

首先设置 root 账户嘅密码：

```bash
passwd root	
```



```bash
yourName="example"
useradd -m $yourName && echo "为用户 $yourName 设置新密码" && passwd $yourName
```



### 桌面环境

呢篇文章我哋安装 KDE [<sup>4</sup>](https://wiki.archlinux.org/title/KDE)：

```bash
pacman -S plasma plasma-wayland-session egl-wayland kde-{accessibility,graphics,multimedia,network,pim,sdk,system,utilities}-meta
```



### VMware Tools

官方嘅 VMware Tools 唔支持 Arch Linux。通常会用 OpenVMTools。

用 Open VM Tools 可能冇办法正常调整屏幕大小。呢度有个根据 [reddit 帖子][3] 嘅解决方案：

```shell
sudo pacman -Syu
sudo pacman -S open-vm-tools
sudo pacman -Su xf86-input-vmmouse xf86-video-vmware mesa gtk2 gtkmm
echo needs_root_rights=yes | sudo tee /etc/X11/Xwrapper.config
sudo systemctl enable --now vmtoolsd
```

咁就搞掂啦。



### 参考资料：

[1]: https://gist.github.com/extremecoders-re/cf8d829c108d58bfbb2e3c1f4121d7e1 "禁用 vmem 文件创建。"

[2]: https://wiki.archlinux.org/title/Installation_guide#Example_layouts "分区布局"
[3]: https://www.reddit.com/r/archlinux/comments/b0ona0/vmtools_on_arch_linux_full_screen_or_resizing/ "vmware tools 指南"

https://blog.zrlab.org/posts/arch-btrfs

https://wiki.archwiki.org

https://ericclose.github.io/Installing-Arch-as-a-guest-with-UEFI-and-GPT.html

https://arch.icekylin.online/rookie/basic-install.html

https://www.reddit.com/r/archlinux/comments/b0ona0/vmtools_on_arch_linux_full_screen_or_resizing/
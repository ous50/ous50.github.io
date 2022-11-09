---
title: 如何为Brother新的打印机驱动打包AUR
date: 2022-01-25 03:46:22
categories:
- Linux
- Arch
tags:
- AUR
- Brother
- Printer
- Package
- Driver
- 驱动
- AUR包
- 打印机
lang: zh-CN
description:
  一般来说，Brother的打印机驱动分成了 cupswraper 和 lpr 两个独立的驱动。Arch-Wiki已经给出了怎么打包这样的驱动的教程，但是有一些新机器的驱动，比如 DCP-B7500D 和 HL-L2350DW ， 是混合在一起的新版驱动包。在这里咱记录下如何打包。
---

# 如何为Brother新的打印机驱动打包AUR

## TODO

- [ ] 优化代码（咕
- [ ] 分析这两种驱动的文件数区别
- [ ] 分析这两种驱动安装过程的区别

## 引言

​    一般来说，Brother的打印机驱动分成了 cupswraper 和 lpr 两个独立的驱动。Arch-Wiki已经给出了[怎么打包这样的驱动的教程](https://wiki.archlinux.org/title/Packaging_Brother_printer_drivers)，但是有一些新机器的驱动，比如 DCP-B7500D 和 HL-L2350DW ， 是混合在一起的新版驱动包。在这里咱记录下如何打包。

## 准备

- Arch-Linux PC ( ~~淦你打包来当然要用啊~~)
- 官方的 .deb 或 .rpm 驱动下载链接
- 建议读一下基本的打包指引(简体中文) https://wiki.archlinux.org/title/Arch_package_guidelines_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)



## 写 PKGBUILD

一般来说这些驱动的版本都是 4.0.0 



咱根据 [Roman Schmocker](https://aur.archlinux.org/account/romasch)的 [brother-hll2350dw package](https://aur.archlinux.org/packages/brother-hll2350dw/) 做了自己的 [PKGBUILD](https://aur.archlinux.org/packages/brother-dcpb7500d/)，请针对自己的实际情况进行修改 :

```
# Maintainer: ous50
pkgname=brother-dcpb7500d
printerModel=DCPB7500D
pkgver=4.0.0
pkgrel=1
pkgdesc="Printing driver for Brother DCP-B7500 printer"
arch=("i686" "x86_64" "armv7l") //请去包中 data.tar.gz 的 '/opt/brother/Printers/$printerModel/lpd' 目录下查看有什么架构 
url="https://support.brother.com/g/b/producttop.aspx?c=in&lang=en&prod=dcpb7500d_as_cn" //该打印机的支持页面
license=("EULA")
groups=("base-devel")
depends=('cups' 'ghostscript')
depends_x86_64=('lib32-glibc')
install="$pkgname.install"
source=(
    "https://download.brother.com/welcome/dlf103663/dcpb7500dpdrv-$pkgver-1.i386.deb"
    )
md5sums=(
    "c5d5c7febae0eab6254cb7332f4038c0"
)

package(){
  tar xf data.tar.gz // If you use .deb as your source, you must use this to fully decompress. (Not tested on .rpm packages)
  cp -R "$srcdir/opt" "$pkgdir/opt"
  ln -s "/opt/brother/Printers/DCPB7500D/lpd/$CARCH/rawtobr3" "$pkgdir/opt/brother/Printers/DCPB7500D/lpd/rawtobr3"
  ln -s "/opt/brother/Printers/DCPB7500D/lpd/$CARCH/brprintconflsr3" "$pkgdir/opt/brother/Printers/DCPB7500D/lpd/brprintconflsr3"

  install -d "$pkgdir/usr/lib/cups/filter/"
  ln -s "/opt/brother/Printers/DCPB7500D/cupswrapper/lpdwrapper" "$pkgdir/usr/lib/cups/filter/brother_lpdwrapper_DCPB7500D"

  install -d "$pkgdir/usr/share/cups/model/"
  ln -s "/opt/brother/Printers/DCPB7500D/cupswrapper/brother-DCPB7500D-cups-en.ppd" "$pkgdir/usr/share/cups/model"

  install -Dm644 "$srcdir/opt/brother/Printers/DCPB7500D/LICENSE_ENG.txt" "$pkgdir/usr/share/licenses/$pkgname/LICENSE_ENG.txt"
  install -Dm644 "$srcdir/opt/brother/Printers/DCPB7500D/LICENSE_JPN.txt" "$pkgdir/usr/share/licenses/$pkgname/LICENSE_JPN.txt"
}
```

修改对应的md5值

要让用户安装的时候得到提示，你可以写一个 xxx.intall 文件 （在我的这个例子是 brother-dcpb7500d.install）：

```
post_install() {
	post_upgrade;
}

post_upgrade() {
echo "Restart CUPS service to load the new files"
echo "You can now register your new printer using the web interface at:"
echo "  http://localhost:631/"
}

```



## 测试安装与上传

写完 PKGBUILD 之后， 做个测试：

```
makepkg -rcsi
```

在安装后重启 cups.service，然后去打印机设置里看看有没有类似的东西：

![model-has-shown-in-the-list.png](https://p.itxe.net/images/2022/01/25/model-has-shown-in-the-list.png)

如果出现了类似的选项，就可以 [上传到AUR repo](https://wiki.archlinux.org/title/AUR_submission_guidelines)

### Tips提示:

在打印机设置中你可能会看到想这样的报错：

```
Failed to search for a recommended driver: 'The name org.fedoraproject.Config.Printing was not provided by any .service files'
```

遇到这种情况下需要安装 system-config-printer ：

```
sudo pacman -S system-config-printer
```



## 致谢

对 [Roman Schmocker](https://aur.archlinux.org/account/romasch) 致以最诚挚的感谢。 ~~没有您的帮助咱甚至连咱的 AUR 包都搞不定，更别说这篇博文了~~.

感谢 Arch-Linux wiki 各位贡献者的教程w

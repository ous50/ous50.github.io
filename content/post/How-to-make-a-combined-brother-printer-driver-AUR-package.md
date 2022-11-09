---
title: How to make a combined brother printer driver AUR package
date: 2022-01-25 03:46:22
categories:
- Linux
- Arch
- Software
tags:
- AUR
- Brother
- Printer
- Package
- Driver
lang: en-US
description:
  Traditionally, Brother printers' drivers are divided with cupswrapper and lpr. The Arch-Wiki gives the solution on how to package them. But there's some printers, e.g. DCP-B7500D and HL-L2350DW, have a combined driver with different file tree. This article is to record how I package.
---



# How to make a combined brother printer driver AUR package 

## TODO

- [ ] Analyze differences of file trees  between the two types
- [ ] Analyze differences of the installation processes between the two types

## Intro

Traditionally, Brother printers' drivers are divided with cupswrapper and lpr. The Arch-Wiki [gives the solution on how to package them](https://wiki.archlinux.org/title/Packaging_Brother_printer_drivers). But there's some printers, e.g. DCP-B7500D and HL-L2350DW, have a combined driver with different file tree. This article is to record how I package.



## Preparation

- Arch-Linux PC (of cause)
- .deb or .rpm download link
- Have learn how to make AUR package https://wiki.archlinux.org/title/Arch_package_guidelines



## Write PKGBUILD

Usually they have a common version 4.0.0



Just make your own adaptation to my [PKGBUILD](https://aur.archlinux.org/packages/brother-dcpb7500d/) (adapted from [Roman Schmocker](https://aur.archlinux.org/account/romasch)'s [brother-hll2350dw package](https://aur.archlinux.org/packages/brother-hll2350dw/)):

```
# Maintainer: ous50
pkgname=brother-dcpb7500d
printerModel=DCPB7500D
pkgver=4.0.0
pkgrel=1
pkgdesc="Printing driver for Brother DCP-B7500 printer"
arch=("i686" "x86_64" "armv7l") //check the '/opt/brother/Printers/$printerModel/lpd' in the data.tar.gz
url="https://support.brother.com/g/b/producttop.aspx?c=in&lang=en&prod=dcpb7500d_as_cn"
license=("EULA")
groups=("base-devel")
depends=('cups' 'ghostscript')
depends_x86_64=('lib32-glibc')
install="$pkgname.install"
source=(
    "https://download.brother.com/welcome/dlf103663/dcpb7500dpdrv-$pkgver-1.i386.deb"
    'cupswrapper-license.txt'
	'lpr-license.txt'
    )
md5sums=(
    "c5d5c7febae0eab6254cb7332f4038c0"
    '97ad0cffd216059e9d1d3121899d8646'
    '5e87a3dc0f3e3438c088eda0f3565f0d'
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

Remember to get 'cupswrapper-license.txt' and 'lpr-license.txt' or just delete them from source

For better notice of user installation, you could write a xxx.install file to help(in my case the filename is brother-dcpb7500d.install):

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



## Test installation and upload

After you have saved the PKGBUILD, do a test installation:

```
makepkg -rcsi
```

restart cups.service after installation and go to check if your model has shown in the list:

![model-has-shown-in-the-list.png](https://p.itxe.net/images/2022/01/25/model-has-shown-in-the-list.png)

If it's shown, then you could [upload it to AUR](https://wiki.archlinux.org/title/AUR_submission_guidelines)

### Tips:

In settings you might see an error like:

```
Failed to search for a recommended driver: 'The name org.fedoraproject.Config.Printing was not provided by any .service files'
```

In this case you need to install system-config-printer package:

```
sudo pacman -S system-config-printer
```



## Thanks

Many thanks to [Roman Schmocker](https://aur.archlinux.org/account/romasch). Without you it would be much harder to finish my AUR package and of course, this blog. 

Thanks Arch-Wiki contributors for good documentations.

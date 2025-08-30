---
title: 喺 WSL2 上面编译 LineageOS
draft: false
date: 2024-01-25 03:46:22
categories:
- Linux
- Android
- WSL
- 软件
tags:
- WSL
- Lineage
- 编译
- 打包
lang: yue-CN
description:
  
---
# 安装 WSL Linux 同编译需要嘅嘢
预设会安装 Ubuntu：
```powershell
# 唔显示进度条，下载快啲：
$ProgressPreference = 'SilentlyContinue'
# 用头先搵到嘅 URL，下载 appx 安装包：
Invoke-WebRequest -Uri https://aka.ms/wslubuntu -OutFile Linux.appx -UseBasicParsing

# 整返个备份同解压缩：
Copy-Item .\Linux.appx .\Linux.zip
Expand-Archive .\Linux.zip

# 搵安装程式：
Get-Childitem -Filter *.exe
```


```shell
# 帮 Ubuntu 装编译需要嘅嘢
sudo apt install bc bison build-essential ccache curl flex g++-multilib gcc-multilib git gnupg gperf imagemagick lib32ncurses5-dev lib32readline-dev lib32z1-dev libelf-dev liblz4-tool libncurses5 libncurses5-dev libsdl1.2-dev libssl-dev libxml2 libxml2-utils lzop pngcrush rsync schedtool squashfs-tools xsltproc zip zlib1g-dev git
```

## 如果系 Debian Bookworm 系统：

```shell
sudo apt install bc bison build-essential ccache curl flex g++-multilib gcc-multilib git git-lfs gnupg gperf imagemagick lib32readline-dev lib32z1-dev libelf-dev liblz4-tool libsdl1.2-dev libssl-dev libxml2 libxml2-utils lzop pngcrush rsync schedtool squashfs-tools xsltproc zip zlib1g-dev libncurses5 
```

# 安装编译工具包：
## Repo
```shell
curl https://storage.googleapis.com/git-repo-downloads/repo |sudo tee /usr/bin/repo
sudo chmod a+x /usr/bin/repo
```

## 平台工具
如果你之前未装过 `adb` 同 `fastboot`，可以[喺 Google 下载原版](https://dl.google.com/android/repository/platform-tools-latest-linux.zip)然后解压缩：
```shell
wget https://dl.google.com/android/repository/platform-tools-latest-linux.zip
wget https://dl.google.cn/android/repository/platform-tools-latest-linux.zip # 俾中国大陆嘅读者用

unzip platform-tools-latest-linux.zip -d ~/.local/bin
```

而家你要将 `adb` 同 `fastboot` 加到你嘅 PATH 环境变量。打开 `~/.profile` 然后加下面啲嘢：
```txt
# 将 Android SDK 平台工具加到 PATH
if [ -d "$HOME/.local/bin/platform-tools" ] ; then
    PATH="$HOME/.local/bin/platform-tools:$PATH"
fi
```
行 `source ~/.profile` 嚟更新你嘅环境，或者直接重开个 shell。

## Python
LineageOS 18+ 打后，编译需要 `python3`。


# 设定 Git
你要设定你嘅名同 email 嚟同步 Android 源码。
```shell
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```

同步源码嗰阵可能要下载啲大文件，所以要装 `git-lfs`：
```shell
git lfs install
```


# 整个新资料夹嚟拉源码
```shell
mkdir lineage-21.0 && cd lineage-21.0
```

# 初始化 repo
```shell
repo init -u https://github.com/LineageOS/android.git -b lineage-21.0 # 同步成个 repo，包晒所有 commit 记录，会用好多位。
repo init -u https://github.com/LineageOS/android.git -b lineage-21.0 --depth=1 # 净系拉最新嘅 commit，冇 commit 记录，用位少好多。
```

# 开始同步 repo
```shell
repo sync -c -j$(nproc --all) --force-sync --no-clone-bundle --no-tags
```

跟住就跟 [LineageOS 编译指南](https://wiki.lineageos.org/devices/rtwo/build/variant2/#download-the-source-code)继续做……

---
title: 在 WSL2 上编译 LineageOS
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
lang: zh-CN
description:
  
---
# 安装 WSL Linux 及编译依赖
默认情况下会安装 Ubuntu：
```powershell
# 不显示进度条以加快下载速度：
$ProgressPreference = 'SilentlyContinue'
# 使用上面找到的 URL，下载 appx 安装包：
Invoke-WebRequest -Uri https://aka.ms/wslubuntu -OutFile Linux.appx -UseBasicParsing

# 创建备份并解压：
Copy-Item .\Linux.appx .\Linux.zip
Expand-Archive .\Linux.zip

# 搜索安装程序：
Get-Childitem -Filter *.exe
```


```shell
# 为 Ubuntu 安装编译依赖
sudo apt install bc bison build-essential ccache curl flex g++-multilib gcc-multilib git gnupg gperf imagemagick lib32ncurses5-dev lib32readline-dev lib32z1-dev libelf-dev liblz4-tool libncurses5 libncurses5-dev libsdl1.2-dev libssl-dev libxml2 libxml2-utils lzop pngcrush rsync schedtool squashfs-tools xsltproc zip zlib1g-dev git
```

## 对于 Debian Bookworm 系统：

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
如果你之前没有安装过 `adb` 和 `fastboot`，你可以[从 Google 下载原始版本](https://dl.google.com/android/repository/platform-tools-latest-linux.zip)并解压：
```shell
wget https://dl.google.com/android/repository/platform-tools-latest-linux.zip
wget https://dl.google.cn/android/repository/platform-tools-latest-linux.zip # 供中国大陆的读者使用

unzip platform-tools-latest-linux.zip -d ~/.local/bin
```

现在你需要将 `adb` 和 `fastboot` 添加到你的 PATH 环境变量中。打开 `~/.profile` 并添加以下内容：
```txt
# 将 Android SDK 平台工具添加到 PATH
if [ -d "$HOME/.local/bin/platform-tools" ] ; then
    PATH="$HOME/.local/bin/platform-tools:$PATH"
fi
```
运行 `source ~/.profile` 来更新你的环境，或者直接重启 shell。

## Python
对于 LineageOS 18+，编译时需要 `python3`。


# 配置 Git
你需要设置你的用户名和邮箱来同步安卓源代码。
```shell
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```

同步源代码时可能需要下载一些大文件，因此请安装 `git-lfs`：
```shell
git lfs install
```


# 创建新目录以拉取源代码
```shell
mkdir lineage-21.0 && cd lineage-21.0
```

# 初始化仓库
```shell
repo init -u https://github.com/LineageOS/android.git -b lineage-21.0 # 同步包含所有提交记录的完整仓库，占用大量空间。
repo init -u https://github.com/LineageOS/android.git -b lineage-21.0 --depth=1 # 只拉取最新的提交，不包含提交历史，占用空间较小。
```

# 开始同步仓库
```shell
repo sync -c -j$(nproc --all) --force-sync --no-clone-bundle --no-tags
```

然后遵循 [LineageOS 编译指南](https://wiki.lineageos.org/devices/rtwo/build/variant2/#download-the-source-code)继续操作……

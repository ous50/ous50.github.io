---
title: Compiling Lineage OS on WSL2
draft: false
date: 2024-01-25 03:46:22
categories:
- Linux
- Android
- WSL
- Software
tags:
- WSL
- Lineage
- Compiling
- Package
lang: en-US
description:
  
---
# Install WSL Linux and Compiling Dependency
By default Ubuntu is installed:
```powershell
# Make downloads faster by not displaying progress bar:
$ProgressPreference = 'SilentlyContinue'
# Using the URL you found above, download the appx package:
Invoke-WebRequest -Uri https://aka.ms/wslubuntu -OutFile Linux.appx -UseBasicParsing

# Make a backup and unpack:
Copy-Item .\Linux.appx .\Linux.zip
Expand-Archive .\Linux.zip

# Search for the installer:
Get-Childitem -Filter *.exe
```


```shell
# Install compiling dependency for Ubuntu
sudo apt install bc bison build-essential ccache curl flex g++-multilib gcc-multilib git gnupg gperf imagemagick lib32ncurses5-dev lib32readline-dev lib32z1-dev libelf-dev liblz4-tool libncurses5 libncurses5-dev libsdl1.2-dev libssl-dev libxml2 libxml2-utils lzop pngcrush rsync schedtool squashfs-tools xsltproc zip zlib1g-dev git
```

## For Debian Bookworm:

```shell
sudo apt install bc bison build-essential ccache curl flex g++-multilib gcc-multilib git git-lfs gnupg gperf imagemagick lib32readline-dev lib32z1-dev libelf-dev liblz4-tool libsdl1.2-dev libssl-dev libxml2 libxml2-utils lzop pngcrush rsync schedtool squashfs-tools xsltproc zip zlib1g-dev libncurses5 
```

# Install build packages:
## Repo
```shell
curl https://storage.googleapis.com/git-repo-downloads/repo |sudo tee /usr/bin/repo
sudo chmod a+x /usr/bin/repo
```

## Platform tools
If you haven’t previously installed `adb` and `fastboot`, you can [download the original version from Google](https://dl.google.com/android/repository/platform-tools-latest-linux.zip) and extract it:
```shell
wget https://dl.google.com/android/repository/platform-tools-latest-linux.zip
wget https://dl.google.cn/android/repository/platform-tools-latest-linux.zip # For readers located in China

unzip platform-tools-latest-linux.zip -d ~/.local/bin
```

Now you have to add `adb` and `fastboot` to your PATH. Open `~/.profile` and add the following:
```txt
# add Android SDK platform tools to path
if [ -d "$HOME/.local/bin/platform-tools" ] ; then
    PATH="$HOME/.local/bin/platform-tools:$PATH"
fi
```
Run `source ~/.profile` to update your environment, or simply restart the shell.

## Python
For Lineage OS 18+, `python3` is required to build a package.


# Configure Git
You would have to set your name to sync android source code.
```shell
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```

Some large files may be required to download when syncing source code, hence install `git-lfs`:
```shell
git lfs intall
```


# Make new directory to pull source code
```shell
mkdir lineage-21.0 && cd lineage-21.0
```

# Initialize repo
```shell
repo init -u https://github.com/LineageOS/android.git -b lineage-21.0 # Sync the whole repo with all commit log, takes a lot of spaces.
repo init -u https://github.com/LineageOS/android.git -b lineage-21.0 --depth=1 # Only pull the latest commit without commit logs, takes not much spaces
```

# Start syncing repo
```shell
repo sync -c -j$(nproc --all) --force-sync --no-clone-bundle --no-tags
```

Then follow [Lineage OS building guide](https://wiki.lineageos.org/devices/rtwo/build/variant2/#download-the-source-code)...


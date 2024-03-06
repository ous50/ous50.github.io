```none
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
# 安装编译依赖
sudo apt install bc bison build-essential ccache curl flex g++-multilib gcc-multilib git gnupg gperf imagemagick lib32ncurses5-dev lib32readline-dev lib32z1-dev libelf-dev liblz4-tool libncurses5 libncurses5-dev libsdl1.2-dev libssl-dev libxml2 libxml2-utils lzop pngcrush rsync schedtool squashfs-tools xsltproc zip zlib1g-dev git

# 配置 repo
curl https://storage.googleapis.com/git-repo-downloads/repo |sudo tee /usr/bin/repo
sudo chmod a+x /usr/bin/repo
```



Install miniconda:

```shell
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh > /tmp/miniconda-installer.sh
bash /tmp/miniconda-installer.sh

```

After installation, run the following command to link python command:

```shell
sudo ln -s /usr/bin/python3 /usr/bin/python
```





```
# 新建文件夹用于存放源码
mkdir lineage && cd lineage

# 初始化 repo
repo init -u https://github.com/LineageOS/android.git -b lineage-21.0 # 同步完整仓库, 带提交历史, 占用空间大
repo init -u https://github.com/LineageOS/android.git -b lineage-21.0 --depth=1 # 仅拉取最新提交, 不带提交历史, 占用空间小

# 开始同步
repo sync
```


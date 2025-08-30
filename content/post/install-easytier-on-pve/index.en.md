---
title: "Install Easytier on Pve"
date: 2025-08-26T10:30:16+08:00
draft: false
tags:
- PVE
- EasyTier
- Software
- NAS
categories:
- Linux
- Networking
- Virtualization
- Software
description: "Due to some missing built-in packages in PVE, the installation process of Easytier requires additional steps."
---

If your internet provider interferes with the GitHub, you can use the following commands to install EasyTier:

```shell
apt update -y sudo unzip openssl 
wget -O /tmp/easytier.sh "https://ghfast.top/https://raw.githubusercontent.com/EasyTier/EasyTier/main/script/install.sh" && sudo bash /tmp/easytier.sh install --gh-proxy https://ghfast.top/
systemctl disable --now easytier@default.service
```
Check the latest proxy [here](https://ghproxy.link).

Otherwise just simply use the default GitHub URL.

```shell
apt update -y sudo unzip openssl 
wget -O /tmp/easytier.sh "https://raw.githubusercontent.com/EasyTier/EasyTier/main/script/install.sh" && sudo bash /tmp/easytier.sh install
systemctl disable --now easytier@default.service
```

Should you wish to use easytier dashboard to manage, you can enable the service with the following command:

```shell
export USER=<your_username>
echo "[Unit]
Description=EasyTier Service
After=network.target syslog.target
Wants=network.target

[Service]
Type=simple
ExecStart=/usr/sbin/easytier-core -w $USER

[Install]
WantedBy=multi-user.target
" | sudo tee /etc/systemd/system/easytier.service

systemctl enable --now easytier.service
```

Then you are able to access the EasyTier dashboard at [https://easytier.cn/web](https://easytier.cn/web).

---
title: "喺 PVE 上安装 EasyTier"
date: 2025-08-26T10:30:16+08:00
draft: false
tags: 
- PVE
- EasyTier
- 软件
- NAS
categories: 
- Linux
- 网络
- 虚拟化
- Software
description: "由于 PVE 嘅内置包有啲缺失，Easytier 嘅安装过程需要额外嘅步骤。"
---

## 安装 EasyTier

如果你嘅网络提供商干扰咗 GitHub，你可以用以下命令嚟安装 EasyTier：

```shell
apt update -y sudo unzip openssl 
wget -O /tmp/easytier.sh "https://ghfast.top/https://raw.githubusercontent.com/EasyTier/EasyTier/main/script/install.sh" && sudo bash /tmp/easytier.sh install --gh-proxy https://ghfast.top/
systemctl disable --now easytier@default.service
```
你可以喺[呢度](https://ghproxy.link)检查最新嘅代理。

否则，只需用默认嘅 GitHub URL。

```shell
apt update -y sudo unzip openssl 
wget -O /tmp/easytier.sh "https://raw.githubusercontent.com/EasyTier/EasyTier/main/script/install.sh" && sudo bash /tmp/easytier.sh install
systemctl disable --now easytier@default.service
```

## 启用 EasyTier 服务

### 用 easytier 仪表板进行管理

如果你希望用 easytier 仪表板进行管理，可以用以下命令启用该服务：

```shell
export USER=<你嘅用户名>
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

然后你就可以喺 [https://easytier.cn/web](https://easytier.cn/web) 访问 EasyTier 仪表板啦。

> 请注意：你需要先喺 EasyTier 仪表板度注册账号再启用该功能。

### 手动配置

直接跟住[官方文档](https://easytier.cn/guide/network/install-as-a-systemd-service.html)进行配置就得。

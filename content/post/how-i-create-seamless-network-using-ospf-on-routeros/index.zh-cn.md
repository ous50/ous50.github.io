---
title: "How I Create Seamless Network Using OSPF on Routeros and Shellcrash on PVE"
date: 2026-01-29T00:58:18+08:00
draft: true
tags:
- PVE
- OSPF
- ShellCrash
- RouterOS
- CloudInit
categories:
- Linux
- Networking
- Virtualization
- Software
- Router
- RouterOS
description: "如何在 RouterOS 上利用 OSPF 和 PVE 上的 ShellCrash 打造无感网络"
---

{{< gh-blockquote type="note" >}} 本文内容基于 **2026年1月29日** 的环境撰写，使用的是 RouterOS `7.20.1` 和 ShellCrash `1.9.4beta6`，两者均作为 KVM 实例运行在 PVE 上。如果你使用的 RouterOS 或 ShellCrash 版本不同，具体内容可能会有所差异，请灵活变通。
{{< /gh-blockquote >}}

## 简介
以前我通过 DHCP 指定网关的方式让网络中的设备使用代理。虽然这种方法能成功实现无感代理，但我没法把这种体验扩展到所有设备上，因为 ShellCrash 有时候是真的会“Crash（崩溃）”，这会直接影响正常的网络流量。我对 OSPF 功能早有耳闻，所以最近参考 [DeepRouter 的文章](https://deeprouter.org/article/routeros-ospf-intelligent-traffic-split) 在 RouterOS 上配置了 OSPF。这篇文章主要用来记录我的折腾经验，并分享我是如何增强整个系统的健壮性（Robustness）的。

## ShellCrash 和 Bird 的配置

虽然把 ShellCrash 和 BIRD 部署在不同的实例里也没问题，但我 **强烈建议** 将它们部署在同一个实例中。

这里略过 ShellCrash 的安装过程，请确保在 DNS 配置中使用了 MIX 模式（按 `2` (功能设置) - `2` (DNS 设置)）。

### 检查 IPv4 和 IPv6 转发配置

运行 `sudo sysctl -p` 并检查以下项是否已正确配置：

```
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
```

如果没有，请编辑 `/etc/sysctl.conf` 进行修改。

### BIRD

我们将使用 [!chnroutes](https://github.com/ous50/nchnroutes) 来区分国内 IP。

安装完 bird 后，请确保不要立即启用或启动它。我们需要先做一些配置工作。

对于 Debian 系统：
```shell
sudo apt update
sudo apt install bird2 make
```

#### bird.conf

编辑 `/etc/bird/bird.conf` 并按照如下内容进行修改。

请确保：
* `router id` 是你的 ShellCrash/BIRD 实例的 IP。
* ospf v2 和 v3 中的 `interface` 都要设置为该实例连接网关（LAN口）所使用的网卡接口名称。
你可以通过 `ip a` 或 `ip link` 来查看，找到那个 **不是** `lo` 的接口。

```conf
log syslog all;

router id 10.0.0.10; # 这里改成你实例的 IP

protocol device {
        scan time 60;
}

protocol kernel {
        ipv4 {
              import none;
              export none;
        };
}
protocol kernel {
        ipv6 {
              import none;
              export none;
        };
}

protocol static {
        ipv4;
        include "/etc/bird/routes4.conf";
}
protocol static {
        ipv6;
        include "/etc/bird/routes6.conf";
}

protocol ospf v2 {
        ipv4 {
                export all;
        };
        area 0.0.0.0 {
                interface "ens18" { # 改成你的网卡接口名称
                        type pointopoint;
                };
        };
}

protocol ospf v3 {
        ipv6 {
                export all;
        };
        area 0.0.0.0 {
                interface "ens18" { # 改成你的网卡接口名称
                        type pointopoint;
                };
        };
}
```

#### 生成路由表

```shell
git clone https://github.com/ous50/nchnroutes.git
cd nchnroutes
make
```

如果你连接 github.com 有困难，可以使用镜像站：

```shell
git clone https://hk.gh-proxy.org/https://github.com/ous50/nchnroutes.git
cd nchnroutes
make
```

如果看到以下输出，说明一切顺利，可以继续：

```shell
python3 produce.py
sudo mv routes4.conf /etc/bird/routes4.conf
sudo mv routes6.conf /etc/bird/routes6.conf
sudo birdc configure
BIRD 2.0.12 ready.
Reading configuration from /etc/bird/bird.conf
Reconfigured
```

## RouterOS 配置

你需要先设置一个旁路路由表，以防止 OSPF 邻居建立后瞬间发生环路。

### 绕过 ShellCrash 防止环路并设置例外

我们将创建一个新的路由表来绕过来自 ShellCrash 的流量，从而防止死循环。

```RouterOS
/routing table
add disabled=no fib name=bypass-shellcrash
/routing rule
add action=lookup-only-in-table comment="Bypass Shellcrash Gateway using Routing Mark" disabled=no routing-mark=bypass-shellcrash table=bypass-shellcrash
```

将你的默认路由从 `main` 表迁移到 `bypass-shellcrash` 表：
```RouterOS
/ip route
add disabled=no distance=1 dst-address=<你的局域网网段带掩码> gateway=lan routing-table=bypass-shellcrash scope=30 suppress-hw-offload=no target-scope=10
add disabled=no distance=1 dst-address=0.0.0.0/0 gateway=<你的互联网网关> routing-table=bypass-shellcrash scope=30 suppress-hw-offload=no target-scope=10
```

#### 防火墙标记 (Mangle)
请确保：
* 将 dst-address 改为你的局域网网段，保留前面的感叹号 `!`。
* 将 src-mac-address 改为 ShellCrash 实例网卡接口的 MAC 地址（可以在 ShellCrash 实例中用 `ip link` 查看，或者直接在 PVE 界面看）。

```RouterOS
/ip firewall mangle
add action=mark-routing chain=prerouting comment=bypass-shellcrash-gateway dst-address=!192.168.0.0/23 new-routing-mark=bypass-shellcrash src-mac-address=11:45:14:19:19:81
```

### OSPF 配置
默认情况下，你不需要更改此脚本中的任何内容。

```RouterOS
/routing ospf instance
add disabled=no name=shellcrash
add disabled=no name=shellcrash-v6 version=3
/routing ospf area
add disabled=no instance=shellcrash name=ospf-area-v4
add disabled=no instance=shellcrash-v6 name=ospf-area-v6
/routing ospf interface-template
add area=ospf-area-v4 cost=10 disabled=no priority=32 type=ptp
add area=ospf-area-v6 cost=10 disabled=no priority=32 type=ptp
```

## 进阶技巧 (Tricks)

### 健壮的 DNS 设置

由于 ShellCrash 使用了 `fake-ip` 模式，你应该将 ShellCrash 的 DNS 设置为上游。

在这种情况下，我们假设将 RouterOS 的 DNS 下发给客户端，并使用以下 RouterOS 脚本来动态更新上游 DNS 源，以增强健壮性，防止 ShellCrash 挂掉导致全网断网。

```RouterOS
:global ospfInstance "shellsrash"
:global ospfDNS "1.1.4.5" # 你的 ShellCrash 实例 IP
:global publicDNS "223.5.5.5" # 这里改为你用于直接上网的公共 DNS

# (true / false), 测试完成后关闭调试模式，否则日志里全是烦人的调试信息。
:local DEBUG false

# 标记最终状态，默认值为 false (down)
:local isOspfActive false

# 尝试寻找邻居
:local neighborIds [/routing ospf neighbor find instance=$ospfInstance]

# 检查是否找到邻居
:if ([:len $neighborIds] > 0) do={
    # 注意：这里我们假设只使用一个实例。
    # 如果你有多个实例，可能需要遍历查找。
    :local neighborState [/routing ospf neighbor get ($neighborIds->0) state]
    
    :if ($DEBUG) do={:log info "[DEBUG] Neighbor found! State: $neighborState"}
    
    # 只有当状态为 "Full" 时才认为 OSPF 活跃。记住是 "Full" 不是 "full"。这个状态名在不同 RouterOS 版本可能不同。
    :if ($neighborState = "Full") do={
        :set isOspfActive true
    }
} else={
    # 如果长度为 0，说明未找到邻居。检查 bird 配置/状态。
    :if ($DEBUG) do={:log info "[DEBUG] No OSPF neighbor found. Logic assumes DOWN."}
    :set isOspfActive false
}

# 根据变量 isOspfActive 更改 DNS
:local currentDNS [/ip dns get servers]

:if ($isOspfActive) do={
    # OSPF 在线
    :if ($DEBUG) do={:log info "[DEBUG] Decision: OSPF is UP."}
    
    :if ($currentDNS != $ospfDNS) do={
        :log warning "OSPF Shellcrash Up: Switching to OSPF DNS ($ospfDNS)."
        /ip dns set servers=$ospfDNS
        /ip dns cache flush
    } else={
        :if ($DEBUG) do={:log info "[DEBUG] DNS is already correct (OSPF)."}
    }
} else={
    # OSPF 离线 (或丢失邻居)
    :if ($DEBUG) do={:log info "[DEBUG] Decision: OSPF is DOWN/MISSING."}
    
    :if ($currentDNS != $publicDNS) do={
        :log warning "OSPF Shellcrash Down: Switching to Public DNS ($publicDNS)."
        /ip dns set servers=$publicDNS
        /ip dns cache flush
    } else={
        :if ($DEBUG) do={:log info "[DEBUG] DNS is already correct (Public)."}
    }
}
```

### 当 ShellCrash 崩溃时关闭 Bird

我们将使用一个 bash 脚本来主动检查 ShellCrash 是否存活。如果 API 无法连接，它将停止 Bird 服务以撤回 OSPF 路由。

将以下代码块复制并粘贴到你的 PVE Shell 中（以 `clash` 用户登录，或具有 sudo 权限的用户）：

```shell
# 1. 创建看门狗脚本 (Watchdog script)
# 注意：我们使用 'EOF' (带引号) 来防止创建时变量被展开。
sudo tee /home/clash/check_clash.sh > /dev/null << 'EOF'
#!/bin/bash

# 配置
API_URL="http://127.0.0.1:9999/"
LOG_FILE="/home/clash/clash_watchdog.log"
DEBUG=false
INTERVAL=3

# 初始化状态 (0=未知, 1=正常, 2=已崩溃)
LAST_STATE=0

while true; do
    # 检查 ShellCrash API
    HTTP_CODE=$(curl -s -m 1 -o /dev/null -w "%{http_code}" "$API_URL")
    
    if [ "$DEBUG" = "true" ]; then 
      echo "[DEBUG] Dashboard code: $HTTP_CODE"
    fi

    if [ "$HTTP_CODE" == "200" ]; then
        # ShellCrash 存活
        if [ "$LAST_STATE" != "1" ]; then
            DATE=$(date "+%Y-%m-%d %H:%M:%S")
            
            # 使用 systemctl 的返回码检查 Bird 是否在运行 (更可靠)
            sudo systemctl is-active --quiet bird
            BIRD_EXIT_CODE=$?
            
            if [ $BIRD_EXIT_CODE -ne 0 ]; then
                if [ "$DEBUG" = "true" ]; then 
                   echo "ShellCrash detected. Starting Bird..."
                fi
                echo "[$DATE] ShellCrash recovered/detected. Starting Bird..." >> $LOG_FILE
                sudo systemctl start bird
            fi
            
            LAST_STATE=1
        fi
    else
        # ShellCrash 已挂
        if [ "$LAST_STATE" != "2" ]; then
            DATE=$(date "+%Y-%m-%d %H:%M:%S")
            if [ "$DEBUG" = "true" ]; then 
               echo "[$DATE] Alert! ShellCrash died (Code: $HTTP_CODE). Stopping Bird!"
            fi
            echo "[$DATE] Alert! ShellCrash died (Code: $HTTP_CODE). Stopping Bird!" >> $LOG_FILE
            
            sudo systemctl stop bird
            LAST_STATE=2
        fi
    fi

    sleep $INTERVAL
done
EOF

# 2. 赋予执行权限
sudo chmod +x /home/clash/check_clash.sh

# 3. 创建 Systemd 服务
sudo tee /etc/systemd/system/clash-watchdog.service > /dev/null << EOF
[Unit]
Description=ShellCrash Watchdog for Bird OSPF
After=network.target

[Service]
User=clash
Group=clash
ExecStart=/home/clash/check_clash.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 4. 启用并启动
sudo systemctl daemon-reload
sudo systemctl enable --now clash-watchdog.service
sudo systemctl status clash-watchdog.service
```

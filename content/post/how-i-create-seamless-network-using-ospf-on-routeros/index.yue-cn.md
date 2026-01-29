---
title: "我係点样喺 RouterOS 用 OSPF 同 PVE 上嘅 ShellCrash 搞个无感网络"
date: 2026-01-29T00:58:18+08:00
draft: false
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
description: "烦紧 ShellCrash 一瓜柴就搞到全屋断网？呢篇文分享一套基于 RouterOS OSPF 同 PVE 嘅高可用网络方案。除咗基本嘅 OSPF 分流配置，仲引入咗自动化嘅 DNS 切换策略同埋 Watchdog 脚本，Ensure 即使 ShellCrash 跪低咗，网络都会自动变返直连，打造真正「无感」又「稳阵」嘅网络体验。"
---

{{< gh-blockquote type="note" >}}
呢篇文章係基于 **2026年1月29日** 嘅环境写嘅，RouterOS 版本係 `7.20.1`，ShellCrash 版本係 `1.9.4beta6`，两个都係喺 PVE 上面跑嘅 KVM。如果你用紧唔同版本嘅 RouterOS 或者 ShellCrash，内容可能会有啲出入，大家自己执生啦。
{{< /gh-blockquote >}}

## 简介
之前我係用 DHCP 指定 Gateway 嘅方法令网络入面嘅机用 Proxy。虽然呢招都可以做到无感 Proxy，但我无办法将呢种体验扩展到全部机度，因为 ShellCrash 有时真係会“Crash（瓜柴）”，咁就会直接搞到正常上网都受影响。我对 OSPF 呢个功能听咗好耐，所以最近跟住 [DeepRouter 篇文章](https://deeprouter.org/article/routeros-ospf-intelligent-traffic-split) 喺 RouterOS 上面 Set 咗 OSPF。呢篇文主要係用来记低我嘅折腾经验，同埋分享下我点样令成个係统稳阵啲 (Robustness)。

## ShellCrash 同 Bird 嘅配置

虽然将 ShellCrash 同 BIRD 放喺唔同 Instance 跑都得，但我 **极度建议** 放喺同一个 Instance 入面。

ShellCrash 安装过程就唔讲啦，记得喺 DNS 配置度用 MIX 模式（按 `2` (功能设置) - `2` (DNS 设置)）。

### Check 下 IPv4 同 IPv6 Forward 配置

Run 下 `sudo sysctl -p` 睇下下面几行係咪 Set 好咗：

```
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
```

如果未，就改下 `/etc/sysctl.conf`。

### BIRD

我哋会用 [!chnroutes](https://github.com/ous50/nchnroutes) 来分返开国内 IP。

装完 bird 之后，记住千祈唔好即刻着咗佢 (start service)。我哋要搞掂啲配置先。

Debian 嘅话：
```shell
sudo apt update
sudo apt install bird2 make
```

#### bird.conf

Edit 下 `/etc/bird/bird.conf` 跟住下面咁改。

记得 Check 清楚：
* `router id` 係你 ShellCrash/BIRD 嗰个 Instance 嘅 IP。
* ospf v2 同 v3 入面嘅 `interface` 都要 Set 做连去 Gateway（LAN口）嗰张网卡。
你可以用 `ip a` 或者 `ip link` 来睇，揾嗰个 **唔係** `lo` 嘅 interface 就係啦。

```conf
log syslog all;

router id 10.0.0.10; # 这里改做你 Instance 嘅 IP

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
                interface "ens18" { # 改做你张网卡个名
                        type pointopoint;
                };
        };
}

protocol ospf v3 {
        ipv6 {
                export all;
        };
        area 0.0.0.0 {
                interface "ens18" { # 改做你张网卡个名
                        type pointopoint;
                };
        };
}
```

#### Generate 啲 Route 出来

```shell
git clone https://github.com/ous50/nchnroutes.git
cd nchnroutes
make
```

如果你连 github.com 有困难，可以用 Mirror：

```shell
git clone https://hk.gh-proxy.org/https://github.com/ous50/nchnroutes.git
cd nchnroutes
make
```

见到下面呢啲 Output 就即係搞掂，可以继续：

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

你需要先 Set 好个旁路路由表，防止 OSPF 邻居一建立就好易 Loop 死 (infinite loop)。

### Bypass ShellCrash 防止 Loop 同埋 Set 例外

我哋会整多张 Routing Table 来 Bypass 来自 ShellCrash 嘅流量，费事佢 Loop。

```RouterOS
/routing table
add disabled=no fib name=bypass-shellcrash
/routing rule
add action=lookup-only-in-table comment="Bypass Shellcrash Gateway using Routing Mark" disabled=no routing-mark=bypass-shellcrash table=bypass-shellcrash
```

将你 Default Route 从 `main` 表搬去 `bypass-shellcrash` 表：
```RouterOS
/ip route
add disabled=no distance=1 dst-address=<你个 LAN 网段带 CIDR> gateway=lan routing-table=bypass-shellcrash scope=30 suppress-hw-offload=no target-scope=10
add disabled=no distance=1 dst-address=0.0.0.0/0 gateway=<你个 Internet Gateway> routing-table=bypass-shellcrash scope=30 suppress-hw-offload=no target-scope=10
```

#### Firewall Tagging (Mangle)
记得留意：
* 将 dst-address 改做你嘅 LAN 网段，前面的感叹号 `!` 要留返喺度。
* 将 src-mac-address 改做 ShellCrash 嗰张网卡嘅 MAC Address（可以喺 ShellCrash 入面打 `ip link` 睇，或者直接喺 PVE 界面睇都得）。

```RouterOS
/ip firewall mangle
add action=mark-routing chain=prerouting comment=bypass-shellcrash-gateway dst-address=!192.168.0.0/23 new-routing-mark=bypass-shellcrash src-mac-address=11:45:14:19:19:81
```

### OSPF Config
默认来讲，呢段 Script 你咩都唔使改。

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

## 醒目 Tips (Tricks)

### 稳阵嘅 DNS Setting

因为 ShellCrash 用咗 `fake-ip` 模式，你应该将 ShellCrash 嘅 DNS Set 做上游。

喺呢个 Case 入面，我哋假设将 RouterOS 嘅 DNS 派俾 Client，跟住用下面呢段 RouterOS Script 动态 Update 上游 DNS，咁样稳阵啲，万一 ShellCrash 瓜咗都唔会搞到全屋断网。

```RouterOS
:global ospfInstance "shellsrash"
:global ospfDNS "1.1.4.5" # 你个 ShellCrash Instance IP
:global publicDNS "223.5.5.5" # 这里改做你用来直接上网个 Public DNS

# (true / false), Test 完记得关咗 Debug 佢，如果唔係个 Log 会好鬼烦。
:local DEBUG false

# Mark 低个最终状态，Default 係 false (down)
:local isOspfActive false

# 尝试揾邻居
:local neighborIds [/routing ospf neighbor find instance=$ospfInstance]

# Check 下揾唔揾到
:if ([:len $neighborIds] > 0) do={
    # Note: 呢度我哋假设只用一个 Instance。
    # 如果你有几个 Instance，可能要 Loop 下去揾。
    :local neighborState [/routing ospf neighbor get ($neighborIds->0) state]
    
    :if ($DEBUG) do={:log info "[DEBUG] Neighbor found! State: $neighborState"}
    
    # 只有当状态係 "Full" 先当 OSPF Active。记住係 "Full" 唔係 "full"。呢个状态名喺唔同 RouterOS 版本可能有分别。
    :if ($neighborState = "Full") do={
        :set isOspfActive true
    }
} else={
    # 如果长度係 0，即係揾唔到邻居。Check 下 bird 配置/状态啦。
    :if ($DEBUG) do={:log info "[DEBUG] No OSPF neighbor found. Logic assumes DOWN."}
    :set isOspfActive false
}

# 根据 isOspfActive 呢个变量来改 DNS
:local currentDNS [/ip dns get servers]

:if ($isOspfActive) do={
    # OSPF Up 咗
    :if ($DEBUG) do={:log info "[DEBUG] Decision: OSPF is UP."}
    
    :if ($currentDNS != $ospfDNS) do={
        :log warning "OSPF Shellcrash Up: Switching to OSPF DNS ($ospfDNS)."
        /ip dns set servers=$ospfDNS
        /ip dns cache flush
    } else={
        :if ($DEBUG) do={:log info "[DEBUG] DNS is already correct (OSPF)."}
    }
} else={
    # OSPF Down 咗 (或者揾唔到邻居)
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

### ShellCrash 瓜咗嗰阵自动熄 Bird

我哋会用个 bash script 主动 check 住 ShellCrash 仲係咪生勾勾 (alive)。如果 API 连唔到，佢就会停咗个 Bird Service 嚟收返啲 OSPF Route。

Copy 下面段 Code 再 Paste 入你 PVE 个 Shell 度（用 `clash` user 登录，或者用有 sudo 权限嘅 user）：

```shell
# 1. 整返个 Watchdog script
# Note: 我哋用 'EOF' (带引号) 来防止 Create 嗰阵啲变量被 Expand 咗。
sudo tee /home/clash/check_clash.sh > /dev/null << 'EOF'
#!/bin/bash

# Configuration
API_URL="http://127.0.0.1:9999/"
LOG_FILE="/home/clash/clash_watchdog.log"
DEBUG=false
INTERVAL=3

# Init 状态 (0=唔知, 1=正常, 2=瓜咗)
LAST_STATE=0

while true; do
    # Check ShellCrash API
    HTTP_CODE=$(curl -s -m 1 -o /dev/null -w "%{http_code}" "$API_URL")
    
    if [ "$DEBUG" = "true" ]; then 
      echo "[DEBUG] Dashboard code: $HTTP_CODE"
    fi

    if [ "$HTTP_CODE" == "200" ]; then
        # ShellCrash 生存
        if [ "$LAST_STATE" != "1" ]; then
            DATE=$(date "+%Y-%m-%d %H:%M:%S")
            
            # 用 systemctl 个 return code 睇下 Bird 有无跑紧 (稳阵啲)
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
        # ShellCrash 瓜咗
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

# 2. 俾个 Execute 权限佢
sudo chmod +x /home/clash/check_clash.sh

# 3. 整返个 Systemd Service
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

# 4. Enable 同 Start 佢
sudo systemctl daemon-reload
sudo systemctl enable --now clash-watchdog.service
sudo systemctl status clash-watchdog.service
```

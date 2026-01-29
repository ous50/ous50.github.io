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
description: "I have built a seamless network using OSPF on RouterOS, this is how I designed the network."
---

{{< gh-blockquote type="note" >}}
Please be advised that this article is written for RouterOS `7.20.1` and ShellCrash `1.9.4beta6` on `2026-01-29`, both operated as KVM instance in PVE. Contents might vary for different version of RouterOS and ShellCrash. 
{{< /gh-blockquote >}}

## Introduction
Previously I used DHCP gateway nomination to let devices in my network use proxy. Although it successfully enables me to use proxy seamlessly, I can't expand this experience to all devices, since sometimes ShellCrash may really "crashed" and would affect normal network traffic. I have heard OSPF feature for a long time, so recently I set up OSPF using RouterOS according to [DeepRouter's article](https://deeprouter.org/article/routeros-ospf-intelligent-traffic-split). This article is to record my experience and share my way to enhance the robustness.

<!-- <script>
  // Your dynamic JavaScript code here (e.g., fetching data from an API)
  document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('dynamic-data').innerText = 'Data loaded at runtime!';
  });
</script>
<div id="dynamic-data">Loading...</div> -->

## ShellCrash and Bird Configuration

Although it is fine to deploy ShellCrash and BIRD in separate instance, it is highly recommended to deploy in the same one.

ShellCrash installation process is ignored, just make sure you are using MIX in DNS configuration(press 2(feature setting) - 2(DNS Setting)).

### Check IPv4 and IPv6 forward configuration

run `sudo sysctl -p` and check if the following are properly configured:

```
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
```

If not, edit `/etc/sysctl.conf`.

### BIRD

We will use [!chnroutes](https://github.com/ous50/nchnroutes) to distinguish chn ips.

Make sure you doesn't enable/start bird service after installation. There are several things to do.

For Debian:
```shell
sudo apt update
sudo apt install bird2 make
```

#### bird.conf

Edit `/etc/bird/bird.conf` and change as below.

make sure:
* `router id` is your ShellCrash/BIRD instance IP
* The `interface` in both ospf v2 and v3 is set to the interface this instance used to connect to the gateway(the LAN port).
You may check using `ip a` or `ip link`, and find the one OTHER THAN `lo`.

```conf
log syslog all;

router id 10.0.0.10; #This line change to instance IP

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
                interface "ens18" { # Change this to your networking interface
                        type pointopoint;
                };
        };
}

protocol ospf v3 {
        ipv6 {
                export all;
        };
        area 0.0.0.0 {
                interface "ens18" { # Change this to your networking interface
                        type pointopoint;
                };
        };
}
```

#### Generating routes

```shell
git clone https://github.com/ous50/nchnroutes.git
cd nchnroutes
make
```

If you have trouble connecting to github.com, use a mirror instead:

```shell
git clone https://hk.gh-proxy.org/https://github.com/ous50/nchnroutes.git
cd nchnroutes
make
```

You are pleased to continue if the following output is shown:

```shell
python3 produce.py
sudo mv routes4.conf /etc/bird/routes4.conf
sudo mv routes6.conf /etc/bird/routes6.conf
sudo birdc configure
BIRD 2.0.12 ready.
Reading configuration from /etc/bird/bird.conf
Reconfigured
```



## RouterOS Configuration

You need to set up bypassing routing table first to prevent looping instantly after OSPF neighbor is found.

### Bypass ShellCrash looping and setting up exceptions

We are going to make another routing table to bypass the traffic from ShellCrash to prevent loop.

```RouterOS
/routing table
add disabled=no fib name=bypass-shellcrash
/routing rule
add action=lookup-only-in-table comment="Bypass Shellcrash Gateway using Routing Mark" disabled=no routing-mark=bypass-shellcrash table=bypass-shellcrash
```

Migrate your routes from `main` to `bypass-shellcrash`:
```RouterOS
/ip route
add disabled=no distance=1 dst-address=<Your LAN with CIDR> gateway=lan routing-table=bypass-shellcrash scope=30 suppress-hw-offload=no target-scope=10
add disabled=no distance=1 dst-address=0.0.0.0/0 gateway=<Your Internet Gateway> routing-table=bypass-shellcrash scope=30 suppress-hw-offload=no target-scope=10
```

#### Firewall tagging
Make sure:
* Change the dst-address to your LAN, preserving the `!`. 
* Change the src-mac-address to the ShellCrash networking interface port MAC address(check using `ip link` in shellcrash instance or directly from PVE)

```RouterOS
/ip firewall mangle
add action=mark-routing chain=prerouting comment=bypass-shellcrash-gateway dst-address=!192.168.0.0/23 new-routing-mark=bypass-shellcrash src-mac-address=11:45:14:19:19:81
```

### OSPF config
By default you do not need to change anything in this script.

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

## Tricks 

### Robust DNS setting

Due to the `fake-ip` used by ShellCrash, you should set ShellCrash's DNS as an upstream. 

In this case we assume nominating RouterOS's DNS to clients and use the following RouterOS script to update upstream DNS source to enhance the robustness, in case of ShellCrash failed. 

```RouterOS
:global ospfInstance "shellsrash"
:global ospfDNS "1.1.4.5" # Your ShellCrash instance IP
:global publicDNS "223.5.5.5" # Change this DNS for your direct internet access

# (true / false), turn debug off after testing or your logs have abundant annoying debug messages.
:local DEBUG false

# marking the final status default value is false (down)
:local isOspfActive false

# Trying to find the neighbor
:local neighborIds [/routing ospf neighbor find instance=$ospfInstance]

# check if neighbor is found
:if ([:len $neighborIds] > 0) do={
    # Note: In this case we will only use one instance.
    # If you have multiple instance, you might need to traversal and find the instance.
    :local neighborState [/routing ospf neighbor get ($neighborIds->0) state]
    
    :if ($DEBUG) do={:log info "[DEBUG] Neighbor found! State: $neighborState"}
    
    # Only consider ospf active when state is "Full". Remember, not "full". This state might vary on different RouterOS version
    :if ($neighborState = "Full") do={
        :set isOspfActive true
    }
} else={
    # if length is 0, this neighbor is not found. check bird configuration/status.
    :if ($DEBUG) do={:log info "[DEBUG] No OSPF neighbor found. Logic assumes DOWN."}
    :set isOspfActive false
}

# change DNS according to the variable isOspfActive 
:local currentDNS [/ip dns get servers]

:if ($isOspfActive) do={
    # OSPF Up
    :if ($DEBUG) do={:log info "[DEBUG] Decision: OSPF is UP."}
    
    :if ($currentDNS != $ospfDNS) do={
        :log warning "OSPF Shellcrash Up: Switching to OSPF DNS ($ospfDNS)."
        /ip dns set servers=$ospfDNS
        /ip dns cache flush
    } else={
        :if ($DEBUG) do={:log info "[DEBUG] DNS is already correct (OSPF)."}
    }
} else={
    # OSPF Down (or missing neighbor)
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

### Switch off bird when shellcrash is crashed

We will use a bash script to actively check if shellcrash is alive. If the API is unreachable, it will stop the Bird service to withdraw OSPF routes.

Copy and paste the following block into your PVE Shell (logged in as the `clash` user, or a user with sudo privileges):

```shell
# 1. Create the watchdog script
# Note: We use 'EOF' (quoted) to prevent variable expansion during creation.
sudo tee /home/clash/check_clash.sh > /dev/null << 'EOF'
#!/bin/bash

# Configuration
API_URL="http://127.0.0.1:9999/"
LOG_FILE="/home/clash/clash_watchdog.log"
DEBUG=false
INTERVAL=3

# Init state (0=unknown, 1=normal, 2=crashed)
LAST_STATE=0

while true; do
    # Check ShellCrash API
    HTTP_CODE=$(curl -s -m 1 -o /dev/null -w "%{http_code}" "$API_URL")
    
    if [ "$DEBUG" = "true" ]; then 
      echo "[DEBUG] Dashboard code: $HTTP_CODE"
    fi

    if [ "$HTTP_CODE" == "200" ]; then
        # ShellCrash is ALIVE
        if [ "$LAST_STATE" != "1" ]; then
            DATE=$(date "+%Y-%m-%d %H:%M:%S")
            
            # Check if Bird is running using systemctl's return code (more reliable)
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
        # ShellCrash is DEAD
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

# 2. Make it executable
sudo chmod +x /home/clash/check_clash.sh

# 3. Create Systemd Service
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

# 4. Enable and Start
sudo systemctl daemon-reload
sudo systemctl enable --now clash-watchdog.service
sudo systemctl status clash-watchdog.service
```

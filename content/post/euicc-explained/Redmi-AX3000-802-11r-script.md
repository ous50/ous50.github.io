```
D6:35:38:7A:1E:F4 Redmi-AX3000-7AB0
24:CF:24:33:4A:89 Redmi-AX3000-2618
46:df:65:4d:28:bf Redmi-AX3000-62EA

D635387A1EF4
24CF24334A89
46df654d28bf
```

```
# 定义你的 10 台机器列表
# 格式为: MAC NAS-ID
LIST="
D6:35:38:7A:1E:F4 Redmi-AX3000-7AB0
24:CF:24:33:4A:89 Redmi-AX3000-2618
46:df:65:4d:28:bf Redmi-AX3000-62EA
"
KEY="d4e8c1b2a5f98e7d6c5b4a3f2e1d0c9b"

# 清空旧的列表并批量写入
uci del_list wireless.default_radio0.r0kh
for item in $LIST; do
    set -- $item
    uci add_list wireless.default_radio0.r0kh="$1,$2,$KEY"
    uci add_list wireless.default_radio0.r1kh="$1,$1,$KEY"
done

uci commit wireless
wifi
```

```
# --- 用户修改区 ---
KEY="d4e8c1b2a5f98e7d6c5b4a3f2e1d0c9b"

# 格式必须严格为: 无线MAC|对应的NAS-ID
# 注意：NAS-ID 必须和那台 AP 设置里的 "NAS ID" 完全一致（大小写敏感）
NODES="
D6:35:38:7A:1E:F4|Redmi-AX3000-7AB0
24:CF:24:33:4A:89|Redmi-AX3000-2618
46:DF:65:4D:28:BF|Redmi-AX3000-62EA
"

# --- 自动执行区 ---
for iface in $(uci show wireless | grep "=wifi-iface" | cut -d'=' -f1); do
    R_ENABLED=$(uci -q get ${iface}.ieee80211r)
    if [ "$R_ENABLED" = "1" ] || [ "$R_ENABLED" = "on" ]; then
        echo "正在修正接口配置: ${iface}"
        
        uci -q delete ${iface}.r0kh
        uci -q delete ${iface}.r1kh
        
        for node in $NODES; do
            MAC=$(echo $node | cut -d'|' -f1)
            NASID=$(echo $node | cut -d'|' -f2)
            
            # R0KH 格式: MAC, NAS-ID, KEY
            uci add_list ${iface}.r0kh="$MAC,$NASID,$KEY"
            
            # R1KH 格式: MAC, R1KH-ID(即MAC), KEY
            # 根据截图，这里中间字段也要填 MAC
            uci add_list ${iface}.r1kh="$MAC,$MAC,$KEY"
        done
    fi
done

uci commit wireless
wifi

```


---
title: 修复联想 Legion（拯救者） 笔电开咗独显直连之后光暗调节功能键冇反应嘅问题
date: 2022-11-08 02:06:00
lang: yue-CN
categories:
  - Linux
  - 系统技巧
tags: 
  - nvidia
  - linux
  - 笔电
  - 背光
  - 功能键
  - 独显直连
  - "ideapad acpi"
  - 拯救者
  - Legion
  - 联想
description: 
  呢篇文章旨在修复联想 Legion（拯救者） 笔电开咗独显直连之后，光暗调节功能键冇反应嘅问题。
---
## 简介

联想 Legion 系列笔电用嘅系 IdeaPad ACPI 驱动，喺普通配置下，除咗 F9（我的最爱键）、F11（切换分页键）同 F12（计数机键）之外，差唔多所有功能键都用到，因为呢几个键嘅 ACPI 功能冇定义到：

```zsh
sudo acpi_listen
 8FC0DE0C-B4E4- 000000d0 00000000 #F9
^[^[[27;5;9~ #F11 
8FC0DE0C-B4E4- 000000d0 00000000 #F12
```

但系如果喺 BIOS 度开咗“独显直连”选项，F5（光啲）同 F6（暗啲）功能键就会冇反应，就算行 `acpi_listen` 显示一切正常都系咁：

```zsh
sudo acpi_listen
video/brightnessup BRTUP 00000086 00000000 #F6
video/brightnessdown BRTDN 00000087 00000000 #F5
```

原因系而家控制背光嘅设备转咗做 `nvidia_0`，同定义好嘅 acpi 动作对唔上。Arch Linux 用户可以装 [xbacklight](https://wiki.archlinux.org/title/Backlight#xbacklight) 喺命令行调校背光。但系个体验好差：次次想调光暗都要开个终端，再用 root 权限行 xbacklight。呢篇文章就系为咗整返好个功能键。

记住：你依然唔可以喺“电池同亮度”设定度调校光暗。

## 解决方案

就咁创建呢啲文件出嚟再重开机就得。

### /etc/acpi/events/FnF6-brightnessup

```
#FnF6 video/brightnessup BRTUP 00000086 00000000
event=video/brightnessup
action=/etc/acpi/actions/FnF6-brightnessup.sh
```

### /etc/acpi/actions/FnF6-brightnessup.sh

```bash
#!/bin/bash 

# 设定静态增加嘅数值。记住，呢个动作会执行两次。
# 呢个数值取决于你个桌面环境实际嘅变化量（KDE 入面系 6）
IncVal=6

# 攞最大光暗度。
read -r MaxVal < "/sys/class/backlight/nvidia_0/max_brightness"

# 攞而家嘅光暗度。
read -r CurrVal < "/sys/class/backlight/nvidia_0/brightness"

# 将新数值设为当前数值加增量。
NewVal=$(($CurrVal + $IncVal)); 
echo $NewVal 

# 将佢设定喺唔超过最大值嘅阈值。
ThresholdVal=$(($NewVal<$MaxVal?$NewVal:$MaxVal)) 
echo $ThresholdVal 

# 直接设定新数值。
echo -n $ThresholdVal > /sys/class/backlight/nvidia_0/brightness 

logger "[ACPI] brightnessup |$CurrVal| |$NewVal| |$ThresholdVal|"

```

### /etc/acpi/events/FnF5-brightnessdown

```
#FnF5 video/brightnessdown BRTDN 00000087 00000000 
event=video/brightnessdown 
action=/etc/acpi/actions/FnF5-brightnessdown.sh
```

### /etc/acpi/actions/FnF5-brightnessdown.sh

```bash
#!/bin/bash 

# 设定静态减少嘅数值。记住，呢个动作会执行两次。
# 呢个数值取决于你个桌面环境实际嘅变化量（KDE 入面系 6）
DecVal=6

# 设定我哋接受嘅最细值。
MinVal=0 

# 攞而家嘅光暗度。
read -r CurrVal < "/sys/class/backlight/nvidia_0/brightness"

# 将新数值设为当前数值减去减量。
NewVal=$(($CurrVal - $DecVal)); 
echo $NewVal 

# 将佢设定喺唔低于最细值嘅阈值。
ThresholdVal=$(($NewVal>$MinVal?$NewVal:$MinVal)) 
echo $ThresholdVal 

# 直接设定新数值。
echo -n $ThresholdVal > /sys/class/backlight/nvidia_0/brightness 

logger "[ACPI] brightnessdown |$CurrVal| |$NewVal| |$ThresholdVal|"

```
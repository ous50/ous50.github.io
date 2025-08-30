---
title: 修复在联想拯救者系列笔记本上启用独显直连后亮度调节功能键失效的问题
date: 2022-11-08 02:06:00
lang: zh-CN
categories:
  - Linux
  - 系统技巧
tags: 
  - nvidia
  - linux
  - 笔记本电脑
  - 背光
  - "功能键"
  - "独显直连"
  - "ideapad acpi"
description: 
  本文旨在修复在联想拯救者系列笔记本上启用独显直连后亮度调节功能键失效的问题。
---
## 简介

联想拯救者系列笔记本电脑使用 IdeaPad ACPI 驱动，在标准配置下，除了 F9（收藏键）、F11（切换标签页键）和 F12（计算器键）之外，几乎所有的功能键都可以正常使用，因为这几个键的 ACPI 功能没有被定义：

```zsh
sudo acpi_listen
 8FC0DE0C-B4E4- 000000d0 00000000 #F9
^[^[[27;5;9~ #F11 
8FC0DE0C-B4E4- 000000d0 00000000 #F12
```

但对于在 BIOS 中开启了“独显直连”选项的用户来说，F5（增加亮度）和 F6（降低亮度）功能键会失效，尽管运行 `acpi_listen` 显示一切正常：

```zsh
sudo acpi_listen
video/brightnessup BRTUP 00000086 00000000 #F6
video/brightnessdown BRTDN 00000087 00000000 #F5
```

原因是现在控制背光的设备已经变成了 `nvidia_0`，与已定义的 acpi 操作不对应。对于 Arch Linux 用户，你可以安装 [xbacklight](https://wiki.archlinux.org/title/Backlight#xbacklight) 通过命令行来调整背光。但这种体验非常糟糕：每次你想调整亮度时，都必须打开控制台并以 root 权限运行 xbacklight。本文旨在修复这个功能键失效的问题。

请注意：你仍然无法在“电池和亮度”设置中调整亮度。

## 解决方案

只需创建这些文件然后重启即可。

### /etc/acpi/events/FnF6-brightnessup

```
#FnF6 video/brightnessup BRTUP 00000086 00000000
event=video/brightnessup
action=/etc/acpi/actions/FnF6-brightnessup.sh
```

### /etc/acpi/actions/FnF6-brightnessup.sh

```bash
#!/bin/bash 

# 设置静态增量值。请注意，这个操作会被执行两次。
# 这个值取决于桌面环境的实际变化量（在 KDE 中是 6）
IncVal=6

# 获取最大亮度值。
read -r MaxVal < "/sys/class/backlight/nvidia_0/max_brightness"

# 获取当前亮度值。
read -r CurrVal < "/sys/class/backlight/nvidia_0/brightness"

# 设置新值为当前值加上增量值。
NewVal=$(($CurrVal + $IncVal)); 
echo $NewVal 

# 将其设置为不超过最大值的阈值。
ThresholdVal=$(($NewVal<$MaxVal?$NewVal:$MaxVal)) 
echo $ThresholdVal 

# 直接设置新值。
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

# 设置静态减量值。请注意，这个操作会被执行两次。
# 这个值取决于桌面环境的实际变化量（在 KDE 中是 6）
DecVal=6

# 设置我们接受的最小值。
MinVal=0 

# 获取当前亮度值。
read -r CurrVal < "/sys/class/backlight/nvidia_0/brightness"

# 设置新值为当前值减去减量值。
NewVal=$(($CurrVal - $DecVal)); 
echo $NewVal 

# 将其设置为不低于最小值的阈值。
ThresholdVal=$(($NewVal>$MinVal?$NewVal:$MinVal)) 
echo $ThresholdVal 

# 直接设置新值。
echo -n $ThresholdVal > /sys/class/backlight/nvidia_0/brightness 

logger "[ACPI] brightnessdown |$CurrVal| |$NewVal| |$ThresholdVal|"

```
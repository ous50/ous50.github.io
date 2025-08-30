---
title: Fixing the brightness function keys in Legion laptops with discrete graphics option enabled
date: 2022-11-08 02:06:00
lang: en
categories:
  - Linux
  - System tricks
tags: 
  - nvidia
  - linux
  - laptop
  - backlight
  - "function keys"
  - "discrete graphics"
  - "ideapad acpi"
description: 
  This article is aimed to fix the malfunctioned keys for legion laptops with descrete graphics options enabled. 
---
## Intro

Lenovo Legion series Laptops uses IdeaPad ACPI and ones in normal configuration can use nearly all of the function keys except for  F9(Favorite key), F11(tab switching key) and F12(Calculator key), since ACPI key functions is not defined:

```zsh
sudo acpi_listen
 8FC0DE0C-B4E4- 000000d0 00000000 #F9
^[^[[27;5;9~ #F11 
8FC0DE0C-B4E4- 000000d0 00000000 #F12
```

 But for users have "discrete graphics" option switched on in BIOS, F5(Brightness Up) and F6(Brightness Down) is not working, although running ``acpi_listen`` shows everything is normal:

```zsh
sudo acpi_listen
video/brightnessup BRTUP 00000086 00000000 #F6
video/brightnessdown BRTDN 00000087 00000000 #F5
```

​	The reason is the device controlling backlight now has changed to ``nvidia_0``, not correspond to the defined acpi actions. For Arch Linux users You can install  [xbacklight](https://wiki.archlinux.org/title/Backlight#xbacklight) to tweak the backlight via command line. But that experience is extremely awful: everytime you want to adjust, you have to turn on console and run xbacklight with root permission. This article is aimed to fix the malfunctioned key. 



​	REMEMBER: you still can not adjust brightness in "battery and brightness".



## Solution

​	Just create these files and reboot.

### /etc/acpi/events/FnF6-brightnessup

```
#FnF6 video/brightnessup BRTUP 00000086 00000000
event=video/brightnessup
action=/etc/acpi/actions/FnF6-brightnessup.sh
```



### /etc/acpi/actions/FnF6-brightnessup.sh

```bash
#!/bin/bash 

# Set the static increment value.  Keep in mind that this will 
# be done twice. 
# This Value is depended on the actual changing value of the DE(in KDE it's 6)
IncVal=6

# Get the Maximum value for use. 
#MaxVal=$(cat /sys/class/backlight/intel_backlight/max_brightness); 
read -r MaxVal < "/sys/class/backlight/nvidia_0/max_brightness"

# Get the current brightness value. 
#CurrVal=$(cat /sys/class/backlight/nvidia_0/brightness); 
read -r CurrVal < "/sys/class/backlight/nvidia_0/brightness"

# Set the new value minus the decrement value. 
NewVal=$(($CurrVal + $IncVal)); 
echo $NewVal 

# Set it to the threshold of the max value. 
ThresholdVal=$(($NewVal<$MaxVal?$NewVal:$MaxVal)) 
echo $ThresholdVal 

# Set the new value directly. 
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

# Set the static decrement value.  Keep in mind that this will 
# be done twice. 
# This Value is depended on the actual changing value of the DE(in KDE it's 6)
DecVal=6

# Set the Minimum we will accept. 
MinVal=0 

# Get the current brightness value. 
#CurrVal=$(cat /sys/class/backlight/nvidia_0/brightness); 
read -r CurrVal < "/sys/class/backlight/nvidia_0/brightness"

# Set the new value minus the decrement value. 
NewVal=$(($CurrVal - $DecVal)); 
echo $NewVal 

# Set it to the threshold of the min value. 
ThresholdVal=$(($NewVal>$MinVal?$NewVal:$MinVal)) 
echo $ThresholdVal 

# Set the new value directly. 
echo -n $ThresholdVal > /sys/class/backlight/nvidia_0/brightness 

logger "[ACPI] brightnessdown |$CurrVal| |$NewVal| |$ThresholdVal|"

```




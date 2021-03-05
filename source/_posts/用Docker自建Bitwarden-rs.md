---
{}
date: 2021-03-05 22:13:06
title:
tags:
---

title: 用Docker自建Bitwarden_rs
tags: bitwarden docker 密码管理器 自建

## 前言

​     ~~那个男孩不想拥有自己的密码管理器呢~~，之前欧式都是google密码和icloud keychain一起用的，混合使用不仅难于跨平台同步（非chrome/apple设备的密码更是无法填充），而且数据也无法自己掌控。上了大学之后，欧式了解到了全平台开源密码管理器bitwarden。经过了将近半年的折腾，终于做得好用点了，现在记录一下。

##     准备的东西

 一个服务器，有200MBRAM

一个域名，这里就用了自己在使用的***(以bitwarden.example.com为例)***

~~还有亿点点耐心和学习搭建密码管理器的兴趣~~



## 下载docker镜像

这里我使用的是Bitwarden_RS，虽然它是第三方重写的，但是需要的资源更少，而且默认开启高级会员的功能~~那个男孩不想白嫖呢~~。

```bash
docker pull bitwardenrs/server:latest
```

打开你的域名dns管理界面，添加bitwarden的dns记录。

## 配置反代

### 情况1:bitwarden单独放在一个服务器上

​           直接跳到初始化配置,然后**设置改为-p 80:80 -p3012:3012**

### 情况2:bitwarden与多个对外服务共存

​           配置nginx反代,根据具体情况修改

添加如下：

```json

```





## 配置bitwarden_RS

### 初始化运行

在命令行根据实际情况（需求）执行

```bash
docker run -d --name=bitwarden_rs -e WEBSOCKET_ENABLED=true -e LOG_FILE/data/bitwarden.log -p xxxx:80 -p xxxx:3012 -v /data-directory-you-want/:/data/ --restart=always  bitwardenrs/server:latest
```

注：

1.   --name=你想要在docker里面显示的名字 ***（此为可选但是欧式感觉比较方便后续管理）***

2.  80和3012的设置端口不能冲突~~此乃废话~~
3.   --restart=always  自动重启
4.    -v /data-directory-you-want/:/data/ 注意这是从根目录开始的~~废废欧式就是没主意到导致现在整个文件夹都在根目录还找了1个星期都没有找到~~ **注意权限** 

### 登录网页并设置初始账户

直接打开bitwarden.example.com，就出现如下图所示界面（根据浏览器语言会有相应语言）

{% asset_img Bitwarden-Login-Page.png Bitwarden login page %}
直接按着引导走就是了。

## 高级设定

### 开启管理界面

​    添加环境变量-e ADMIN_TOKEN=XXXX（XXXX为管理界面密码）

​    打开bitwarden.example.com/admin，用你设置好的token登入

​    登入后在general settings那里把domain url改成你的域名https://bitwarden.example.com(注意要加https://)

​     allow new signups就是新用户注册许可啦（

{% asset_img  Bitwarden-General-Settings.png Bitwarden general settings %}

### 添加smtp服务

   配置smtp服务可以开启bitwarden的邮件传送功能，能开启二步验证(2FA)，能发送邀请，~~**还能给自己邮箱发送password hint(管理密码提示)防止自己脑残忘掉master password**~~

   这里欧式用的是yandex的self-host email，配置教程可以看[newslearner的教程（有些内容有可能过时）](https://www.newlearner.site/2019/08/05/yandex-domain-mail.html)或者[yandex自己的教程(EN)](https://yandex.com/support/connect/add-domain.html)。

   1. 创建新的成员账户，即需要用的收发信账户。
   2. 登入并完成注册。
   3. 打开[yandex mail](mail.yandex.com)登入，打开设置![Email web panal](Email-Web-Panal.png)
   4. 选other，然后左边选email client，开启第三方客户端访问权限 ![Yandex email client settings](Yandex-Email-Client-Settings.png)
   5. 到security那里，生成app password并复制。
   6. 回到管理界面，在smtp Email settings那里如图填(或者叫Starttls on， port 587)，password就填入刚才生成的app password。![bitwarden smtp email settings](Bitwarden-SMTP-Email-Settings.png)
   7. 保存，并到下方的send test email测试
   8. 收到测试邮件如下即成功!![bitwarden smtp test success](Bitwarden-SMTP-Test-Success.png) ![test email success](Test-Email-Success.png)
      9.enjoy~


---
title: 利用docker搭建vaultwarden
date: 2021-03-12 17:04:18
lang: zh-CN
categories:
  - 软件
tags: 
  - bitwarden
  - vaultwarden
  - docker
  - password manager
  - 密码管理器
  - 上云
  - O V H
  - 服务器
description: 
  Bitwarden是一个免费、自由且开源的的密码管理器，服务端也完全开源，可以自己搭建。
  本文将咱自建vaultwarden的过程记录下来。
---

Bitwarden是一个免费、自由且开源的的密码管理器，服务端也完全开源，可以自己搭建。
本文将咱自建bitwarden的过程记录下来。

## 更新 Updates 

2021-09-30 ：了解更多nginx之后重新写了一遍config，而 Bitwarden_RS 已经改名成 Vaultwarden 了

2021-11-03 ：增加了使用CDN访问时获取访客真实ip的方法

2021-11-15 ：1. 修改了文章顺序提高阅读性 2.[增加了docker-compose的启动方法](#Docker-compose ~~（没试过，有时间试试）~~)

2022-08-15 ： 因应 vaultwarden wiki 的更新，修改了nginx 配置

2023-01-11：新增了[自动备份](#备份与还原)

## 前言

~~那个男孩不想拥有自己的密码管理器呢~~，之前欧式都是 Google 密码和 iCloud keychain 一起用的，混合使用不仅难于跨平台同步（非chrome/apple设备的密码更是无法填充），而且数据也无法自己掌控。上了大学之后，我了解到了全平台开源密码管理器bitwarden。经过了将近半年的折腾，终于做得好用点了，现在记录一下。

##     准备的东西

 一个服务器，至少200MB RAM

一个域名，这里就用了自己在使用的 ***(以 bitwarden.example.com 为例)***

~~还有亿点点耐心和学习搭建密码管理器的兴趣~~



## 下载docker镜像

这里我使用的是vaultwarden（前称Bitwarden_RS），虽然它是第三方用Rust重写的，但是需要的资源更少，而且默认开启高级会员的功能 ~~谁不想白嫖呢~~。

```
docker pull vaultwarden/server
```

打开你的域名dns管理界面，添加bitwarden的dns记录。

## 配置vaultwarden

### 初始化运行

#### Docker-compose ~~（没试过，有时间试试）~~

> **注意**
> 需要先行安装 Docker-compose 包

根据 [Vaultwarden-Wiki中关于Docker-Compose的描述](https://github.com/dani-garcia/vaultwarden/wiki/Using-Docker-Compose)，你要找个自己舒服的地方，新建 docker-compose.yml:

```bash
touch docker-compose.yml
```

或者直接进行一个nano的使用 ~~这是什么保姆级教学~~：

```bash
nano docker-compose.yml
```

然后根据自己的情况把下面的贴进去：

```plaintext
version: '3'

services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: always #指定重启策略
    ports:
      - "127.0.0.1:<http port>:80"
      - "127.0.0.1:3012:3012"
    environment:
      - WEBSOCKET_ENABLED=true  # 启用 WebSocket 通知.
      #- ADMIN_TOKEN= #启用管理界面
    volumes:
      - /data-directory-you-want/:/data #指定你的数据存放目录（改冒号左边）
      
```



之后进行一个docker-compose 的跑：

```bash
docker-compose up -d
```



#### Docker-cli

在命令行根据实际情况（需求）执行

```bash
docker run -d --name=vaultwarden -e WEBSOCKET_ENABLED=true -e LOG_FILE=/data/bitwarden.log -p 127.0.0.1:<http port>:80 -p 127.0.0.1:<websocket port>:3012 -v /data-directory-you-want/:/data/ --restart=always  vaultwarden/server:latest
```

注：

1.   --name=你想要在docker里面显示的名字 ***（可选，方便后续管理）***

2.   80和3012的设置端口不能冲突~~废话~~
3.   --restart=always  自动重启
4.   -v /data-directory-you-want/:/data/ 注意这是绝对路径,~~一开始没注意到导致现在整个文件夹都在根目录还找了1个星期都没有找到~~



然后[配置反代](#配置反代)（一定要设置TLS）。

### 登录网页并设置初始账户

直接打开 [bitwarden.example.com]() ，就出现如下图所示界面（当然这是支持中文的）

[![Bitwarden-Login-Page-1615477941215.png](https://p.itxe.net/images/2021/03/12/Bitwarden-Login-Page-1615477941215.png)](https://pic.itxe.net/image/uF71)
直接按着引导走就是了。

## 配置反代

### 情况1:bitwarden单独放在一个服务器上


直接跳到[初始化配置](#初始化运行),然后**将设置改为 -p 80:80 -p 3012:3012**

### 情况2:bitwarden与多个对外服务共存

配置Nginx反代,根据具体情况修改
修改/etc/nginx/nginx.conf，添加如下：

```
# http
    server {
        listen       80;
        listen  [::]:80;
        server_name  bitwarden.example.com;
       ##防止搜索引擎收录
       if ($http_user_agent ~* "qihoobot|Baiduspider|Googlebot|Googlebot-Mobile|Googlebot-Image|Mediapartners-Google|Adsbot-Google|Feedfetcher-Google|Yahoo! Slurp|Yahoo! Slurp China|YoudaoBot|Sosospider|Sogou spider|Sogou web spider|MSNBot|ia_archiver|Tomato Bot|^$") {  
        return 404;
            }
        location / { # 访问80端口后的所有路径都转发到 proxy_pass 配置的ip中

##如果使用cf加速就换成302
         return 301 https://bitwarden.example.com;
            
        }
    }


# https
 server {
        listen       443 ssl http2;
        listen  [::]:443 ssl http2;
        server_name  bitwarden.example.com;
           if ($http_user_agent ~* "qihoobot|Baiduspider|Googlebot|Googlebot-Mobile|Googlebot-Image|Mediapartners-Google|Adsbot-Google|Feedfetcher-Google|Yahoo! Slurp|Yahoo! Slurp China|YoudaoBot|Sosospider|Sogou spider|Sogou web spider|MSNBot|ia_archiver|Tomato Bot|^$") {  
        return 404;
        }
        #启用HSTS    
	add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always; 

		ssl_certificate /path/to/ssl/cert;

		ssl_certificate_key /path/to/cert/key;

		keepalive_timeout   70;

		ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

             location / {

               proxy_set_header Host $host;

               proxy_set_header X-Real-IP $remote_addr;

               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

               proxy_set_header X-Forwarded-Proto $scheme;

               proxy_set_header X-Forwarded-Port $server_port;

               proxy_pass http://localhost:<http port>;
            
          }
          
              location /notifications/hub {
               proxy_set_header Upgrade $http_upgrade;

               proxy_set_header Connection $http_connection;

               proxy_set_header X-Real-IP $proxy_add_x_forwarded_for;

               proxy_pass http://localhost:<websocket port>;

            }

            location /notifications/hub/negotiate {
               proxy_http_version 1.1;

               proxy_set_header "Connection" "";

               proxy_set_header Host $host;

               proxy_set_header X-Real-IP $remote_addr;

               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

               proxy_set_header X-Forwarded-Proto $scheme;

               proxy_pass http://localhost:<http port>;
    }
              
  }
```

保存并退出，重启nginx：

```bash
systemctl restart nginx
```



## 高级设定

### 开启管理界面

添加环境变量-e ADMIN_TOKEN=XXXX（XXXX为管理界面密码）
	
打开bitwarden.example.com/admin，用你设置好的token登入
	
登入后在general settings那里把domain url改成你的域名https://bitwarden.example.com (注意要加https://)
	
allow new signups就是新用户注册许可的开关啦（

[![Bitwarden-General-Settings.png](https://p.itxe.net/images/2021/03/12/Bitwarden-General-Settings.png)](https://pic.itxe.net/image/uGLu)

### 添加 SMTP 服务

   配置 SMTP 服务可以开启bitwarden的邮件传送功能，能开启二步验证(2FA)，能发送邀请，~~**还能给自己邮箱发送password hint(管理密码提示)防止自己脑残忘掉master password**~~

   这里咱用的是yandex的self-host email，配置教程可以看[newslearner的教程（有些内容有可能过时）](https://www.newlearner.site/2019/08/05/yandex-domain-mail.html)或者[yandex自己的教程(EN)](https://yandex.com/support/connect/add-domain.html)。

1. 创建新的成员账户，即需要用的收发信账户。
2. 登入并完成注册。
3.  打开[yandex mail](mail.yandex.com)登入，打开设置[![Email-Web-Panal.png](https://p.itxe.net/images/2021/03/12/Email-Web-Panal.png)](https://pic.itxe.net/image/ueKs)
4. 选other，然后左边选email client，开启第三方客户端访问权限 [![Yandex-Email-Client-Settings.png](https://p.itxe.net/images/2021/03/12/Yandex-Email-Client-Settings.png)](https://pic.itxe.net/image/ukxN)
5.  到security那里，生成app password并复制。
6. 回到管理界面，在smtp Email settings那里如图填(或者叫Starttls on， port 587)，password就填入刚才生成的app password。[![Bitwarden-SMTP-Email-Settings.png](https://p.itxe.net/images/2021/03/12/Bitwarden-SMTP-Email-Settings.png)](https://pic.itxe.net/image/uoE0)
7. 保存，并到下方的send test email测试
8. 如果看到这个banner出来并收到如下测试邮件的话，Yattase！配置成功了w！[![Test_email_success.png](https://p.itxe.net/images/2021/11/02/Test_email_success.png)](https://pic.itxe.net/image/oRqe)
9. Enjoy~

### 使用CDN时让实例获取访客真实ip

一般来讲咱们都会使用CDN来提高服务可用性。但是默认设置中Vaultwarden读取 X-Real-IP 的header，这样会读到的全是CDN的节点IP。

要做到获取访客真实IP，可以直接在Admin Panel 中找到 Read Client Header，改成 X-Forwarded-For 保存即可。

## 备份与还原

这种高敏感度的东西，在各种意义上都需要有备份 ~~，最主要是防止像下图[OVH这样](https://www.reuters.com/article/us-france-ovh-fire/millions-of-websites-offline-after-fire-at-french-cloud-services-firm-idUSKBN2B20NU)真.数据上云的情况~~

![数 据 上 云 图](https://static.reuters.com/resources/r/?m=02&d=20210310&t=2&i=1554440499&r=LYNXMPEH290XD&w=800)

咱一直都直接把整个目录打包扔到本地的，具体的操作 [H3arn的博客](https://blog.h3a.moe/zh/src/d7395/#%E5%A4%87%E4%BB%BD) 已经有说明了， ~~咱懒得写了咕咕咕~~

------

我现在是用cron每小时都备份一次，去掉config.json:

```
#!/bin/bash
PATH=/sbin:/usr/sbin/:/usr/local/sbin:/bin:/usr/local/bin

/usr/bin/tar --zstd -cf <备份的位置>/bw-bkp$(date '+%F_%H%M%S').tar.zst  <数据位置>/attachments  <数据位置>/db.sqlite3* <数据位置>/rsa* <数据位置>/sends <数据位置>/icon_cache
```

~~这样就能将数据库到处扔了w~~

如果你嫌麻烦，或者想数据随便放哪里都行，可以直接整个文件夹都备份：

```
#!/bin/bash
PATH=/sbin:/usr/sbin/:/usr/local/sbin:/bin:/usr/local/bin

/usr/bin/tar --zstd -cf <备份的位置>/bw-bkp$(date '+%F_%H%M%S').tar.zst  <数据位置>
```



也可以用 PGP 加密之后到处扔，保管好自己的 private key 就行。只要把自己的 public key 扔到服务器并信任这个 key 就行：

```
#!/bin/bash
PATH=/sbin:/usr/sbin/:/usr/local/sbin:/bin:/usr/local/bin

/usr/bin/gpgtar -e -r （你的 Key ID）  （数据位置） > （备份的位置）/bw-bkp$(date '+%F_%H%M%S').tar.gpg
```



### 自动备份

根据上面的这一堆东西操作，写了个 [脚本](https://github.com/ous50/vaultwarden-backup)。需要安装 `gpg`  `curl` 和 `rsync` 。直接把这个下下来，然后根据需求改一下， 新建一个定时任务定期跑一下就行。



## 致谢

感谢```h3arn```发现咱的博客的问题，并做了咱一直没写的 [备份与还原](#备份与还原) 部分。

感谢```8-bit Inc.``` 与 ```dani-garcia```，分别做出了 bitwarden及其衍生项目vaultwarden，让咱们有一个新的选择。

## Links:

Bitwarden官网: https://bitwarden.com/
Vaultwarden Github页面（有任何问题记住要**往这边反映**）: https://github.com/dani-garcia/vaultwarden
Vaultwarden Docker页面: https://hub.docker.com/r/vaultwarden/server



# 版权声明

本文由[欧式fifty（ous50）](https://fars.ee/nzWU)原创，采用[Attribution-NonCommercial-ShareAlike 4.0 International](http://creativecommons.org/licenses/by-nc-sa/4.0/)授权

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://p.itxe.net/images/2021/03/12/88x31.png" /></a>This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>. 转载请附上原文地址 https://blog.ous50.moe/2021/03/12/vaultwarden搭建/
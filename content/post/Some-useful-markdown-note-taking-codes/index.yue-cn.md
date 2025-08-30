---
title: 一啲有用嘅 Markdown 笔记 code
date: 2022-09-16 16:00:00
lang: yue-CN
categories:
- 笔记
math: true
tags: 
- markdown
- 编程
- 屑屎山
- html
description: 
  我平时用开嘅 Markdown 笔记 code
---

##  数学

### 行内数学（LaTeX?）表达式

喺你嘅编辑器度开“行内数学公式”呢个选项。喺我嘅编辑器 Typora 度，你可以喺 `档案>>偏好设定>>Markdown>>语法支援>>行内公式` 度开。跟住好似下面咁写就得（条式啱定错就唔好理啦，横掂都系示范下啫）：

```latex
$inline \ math \ example: \ f(x)=x^2+y_2$
```

佢睇起上嚟会系咁: $inline \ math \ example: \ f(x)=x^2+y_2$ 



## 写笔记

### 改文字同背景颜色

Markdown 预设系改唔到文字颜色嘅。但系通过写 HTML code，就可以改到文字同背景嘅颜色。

呢度有个例子

```html
<span style="color:'颜色名或者html颜色code'">文字</span> //文字颜色

<span style="background-color:'颜色名或者html颜色code'">文字</span> //背景颜色

```

<span style="color:blue">蓝色</span>

<span style="background-color:yellow">黄色背景</span>

再得意啲嘅系，你仲可以喺 HTML 渲染入面继续用 Markdown 格式：

```
<span style="background-color:#00ffff"><span style="color:red">红色字</span>喺青色背景度</span>

<span style="background-color:#00ffff"><span style="color:red">**粗体红字**</span>喺青色背景度</span>

<span style="background-color:#00ffff"><span style="color:red">**粗体红色 $LaTeX$ 表达式**</span>喺青色背景度</span>
```

<span style="background-color:#00ffff"><span style="color:red">红色字</span>喺青色背景度</span>

<span style="background-color:#00ffff"><span style="color:red">**粗体红字**</span>喺青色背景度</span>

<span style="background-color:#00ffff"><span style="color:red">**粗体红色 $LaTeX$ 表达式**</span>喺青色背景度</span>

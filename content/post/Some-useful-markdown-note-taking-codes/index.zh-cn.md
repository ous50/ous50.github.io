---
title: 一些有用的 Markdown 笔记代码
date: 2022-09-16 16:00:00
lang: zh-CN
categories:
- 笔记
math: true
tags: 
- markdown
- 编程
- 屑屎山
- html
description: 
  我日常使用的 Markdown 笔记代码
---

##  数学

### 行内数学（LaTeX?）表达式

在你的编辑器中打开“行内数学公式”选项。在我的编辑器 Typora 中，你可以在 `文件>>偏好设置>>Markdown>>语法支持>>行内公式` 中打开它。然后就像下面这样写（请不要评判这个方程式的对错，毕竟这只是一个演示）：

```latex
$inline \ math \ example: \ f(x)=x^2+y_2$
```

它看起来会像： $inline \ math \ example: \ f(x)=x^2+y_2$ 



## 记笔记

### 更改文本和背景颜色

Markdown 默认无法更改文本颜色。但通过编写 HTML 代码，可以更改文本颜色和背景颜色。

这是一个例子

```html
<span style="color:'颜色名称或html颜色代码'">文本</span> //文本颜色

<span style="background-color:'颜色名称或html颜色代码'">文本</span> //背景颜色

```

<span style="color:blue">蓝色</span>

<span style="background-color:yellow">黄色背景</span>

更有趣的是，你仍然可以在 HTML 渲染中使用 Markdown 格式：

```
<span style="background-color:#00ffff"><span style="color:red">红色文本</span>在青色背景中</span>

<span style="background-color:#00ffff"><span style="color:red">**加粗的红色文本**</span>在青色背景中</span>

<span style="background-color:#00ffff"><span style="color:red">**加粗的红色 $LaTeX$ 表达式**</span>在青色背景中</span>
```

<span style="background-color:#00ffff"><span style="color:red">红色文本</span>在青色背景中</span>

<span style="background-color:#00ffff"><span style="color:red">**加粗的红色文本**</span>在青色背景中</span>

<span style="background-color:#00ffff"><span style="color:red">**加粗的红色 $LaTeX$ 表达式**</span>在青色背景中</span>

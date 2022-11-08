---
title: Some useful markdown noting codes
date: 2022-09-16 16:00:00
lang: en-GB
tags: 
- markdown
- coding
- 屑屎山
- html
description: 
  My daily using markdown note taking codes
---
# Some useful markdown note taking codes

##  Maths

### In-line maths(LaTeX?) expressions

Turn on the "In-line Math Equation" option in your editor. In my editor Typora, you can turn it on in   ``File>>Preferences>>Markdown>>Syntax Support>>Inline Math``. Then just write as the following(Please don't judge whether the equation is wrong or not, after all, this is just a demonstration.):

```latex
$inline \ math \ example: \ f(x)=x^2+y_2$
```

It will look like  $inline \ math \ example: \ f(x)=x^2+y_2$ 



## Note taking

### Changing the text and background colour

Markdown is not able to change text number by default. But by writing HTML code, one could change the text color and bkg colour.

Here's an example

```html
<span style="color:'the colour name or the html colour code'">text</span> //text colour

<span style="background-color:'the colour name or the html colour code'">text</span> //background colour

```

<span style="color:blue">blue</span>

<span style="background-color:yellow">yellow background colour</span>

More interestingly, you could still use markdown format inside the html rendering:

```
<span style="background-color:#00ffff"><span style="color:red">Red text</span> in cyan background colour</span>

<span style="background-color:#00ffff"><span style="color:red">**Bold red text**</span> in cyan background colour</span>

<span style="background-color:#00ffff"><span style="color:red">**Bold red $LaTeX$ expression**</span> in cyan background colour</span>
```

<span style="background-color:#00ffff"><span style="color:red">Red text</span> in cyan background colour</span>

<span style="background-color:#00ffff"><span style="color:red">**Bold red text**</span> in cyan background colour</span>

<span style="background-color:#00ffff"><span style="color:red">**Bold red $LaTeX$ expression**</span> in cyan background colour</span>


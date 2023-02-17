目录

油猴脚本概述

脚本注释/注解

脚本权限 grant 

添加新脚本

自定义网页倒计时

网页浏览离开黑屏保护

微博视频下载助手

华为云工作项列表突出展示工作项

Greasy Fork 发布脚本

油猴脚本概述
Tampermonkey 是一款免费的浏览器扩展和最为流行的用户脚本管理器，相当于一个管理插件的插件，它适用于 Chrome, Microsoft Edge, Safari, Opera Next, 和 Firefox。
虽然有些受支持的浏览器拥有原生的用户脚本支持，但 Tampermonkey 将在您的用户脚本管理方面提供更多的便利，它提供了诸如便捷脚本安装、自动更新检查、标签中的脚本运行状况速览、内置的编辑器等众多功能， 同时Tampermonkey还有可能正常运行原本并不兼容的脚本。
官网及下载安装地址：Home | Tampermonkey，安装非常简单，与安装普通的插件无异。
Tampermonkey 内置有编辑器，可以非常方便地管理、编辑用户脚本；支持自动更新检查功能。
官网文档：https://www.tampermonkey.net/documentation.php。
脚本注释/注解
1、如下所示为新建脚本时的默认内容，顶部的注释/注解表明了脚本的各个属性。

2、元数据块必须位于顶部 ==UserScript== 之间。

3、Greasy Fork 要读取的脚本元键值：https://greasyfork.org/zh-CN/help/meta-keys

// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://mp.csdn.net/mp_blog/creation/editor/new?spm=1001.2101.3001.5352
// @icon         https://www.google.com/s2/favicons?sz=64&domain=csdn.net
// @grant        none
// ==/UserScript==
 
(function() {
    'use strict';
 
    // Your code here...
})();

属性名

作用

@name

油猴脚本名称，会展示到浏览器中。必填项。

@namespace

脚本命名空间，用于唯一确定脚本。油猴管理面包中点击主页按钮即可跳转到此地址。

@homepage	主页地址。油猴管理面包中点击主页按钮即可跳转到此地址。可以作为脚本更新网址。
@version

脚本版本，用于脚本的更新。必填项。

@icon	用于指定脚本图标，可以设置为图片 URL 地址或 base64 的字符串
@description

脚本描述。必填项。

@author

作者名字

@license

脚本所使用的许可协议名称或地址，该协议需包含用户是否允许二次分发  或修改  脚本的权利。

其它人都可以随意使用时，指定为 MIT 即可。

@match

使用通配符匹配需要运行网址，例如 * 、 http://* 、 http://www.baidu.com/*等。

@exclude	排除匹配到的网站。
@include	保护匹配到的网站。
@run-at	指定脚本的运行时机，如 页面加载完成时执行：@run-at document-end
@grant

指定脚本运行所需权限，拥有相应的权限才能调用油猴扩展提供的与浏览器进行交互的API。如果为 none，则不使用沙箱环境，脚本会直接运行在网页的环境中，这时无法使用大部分油猴扩展的 Api，而只能使用油猴默认添加的几个最常用 Api。

@require

指定脚本依赖的其他js库，比如 JQuery。

@connect

用于跨域访问时指定的目标网站域名。

当用户使用 gm_xmlhttprequest 请求远程数据的时候，需要使用connect指定允许访问的域名，支持域名、子域名、ip地址以及 * 通配符

@updateURL

@installURL
@downloadURL

脚本更新网址，当油猴扩展检查更新的时候，会尝试从这个网址下载脚本，然后比对版本号确认是否更新，不写时，@homepage也可以代替。

@supportURL	用户可获得该脚本技术支持的链接地址 (如：错误反馈系统、论坛、电子  邮件)，该链接将显示在脚本的反馈页面。
@contributionURL	用于捐赠脚本作者的链接，该链接将显示在脚本的反馈页面。
@contributionAmount	建议捐赠金额，请配合 @contributionURL 使用。
脚本权限 grant 
1、@grant 常用的权限，注意其中的前缀 GM 必须大写。

权限名

功能

@grant unsafewindow

允许脚本可以完整访问原始页面，包括原始页面的脚本和变量。

@grant GM_getValue

//GM_getValue(name,defaultvalue)

从油猴扩展的存储中访问指定key的数据。可以设置默认值，在没成功获取到数据的时候当做初始值。如果保存的是日期等类型的话，取出来的数据会变成文本，需要自己转换一下。

@grant GM_setValue

将数据保存到油猴扩展的存储中：GM_setValue(name,value)。

即使关了浏览器，重新打开仍然能获取到值。

同一个值在匹配的全部网页中都能获取到，所以必须在属性名中加以区分。

@grant GM_deleteValue

将数据从油猴扩展的存储中删除：GM_deleteValue(name)

@grant GM_listValues	从油猴扩展的存储中访问全部数据。
@grant GM_addValueChangeListener	
添加对 gm_setvalue 的值进行监听，当值发生变化时，调用方法事件。

// 添加一个监听器
const listener_id = GM_addValueChangeListener('hello',function(name, old_value, new_value, remote){
            // 方法回调
});

@grant GM_removeValueChangeListener	移除对 GM_setvalue 的值进行监听：GM_removeValueChangeListener(listener_id)
@grant GM_xmlhttprequest

异步请求数据。

GM_xmlhttpRequest({
    url: "http://www.httpbin.org/post",
    method: 'POST',
    headers: {
            "content-type": "application/json"
      },
    data: {xxx},
    onerror: function(res){
        console.log(res);
    },
    onload: function(res){
        console.log(res);
    }
});

@grant GM_setclipboard

// GM_setclipboard(data, info)

将数据复制到剪贴板中，第一个参数是要复制的数据，第二个参数是mime类型，用于指定复制的数据类型。

@grant GM_log

用于在控制台中打印日志，便于调试： GM_log("Hello World")

也可以使用原生的 console.log(xxx); 打印日志。

@grant GM_addStyle

向网页中指定元素(可以通过标签名,class样式,ID等选择)添加样式：GM_addStyle(css)
示例一：GM_addStyle("#main_nav,.title_box-WbZs0QZH{display:none !important}");
  a、向指定id的元素，以及含有指定样式的元素添加css样式。
  b、多个选择器时用逗号隔开，多个style样式属性时用分号隔开。
  c、每一个css属性后面要跟一个 !important，表示添加的属性权限。
示例二：* 表示选择所有元素,如 GM_addStyle("* {margin-top:0px !important; margin-left:0px !important}");

示例三：GM_addStyle("div .logo {background-image: url('http://xxxxxx.jpg') !important}");

  a、为含有 .logo 样式的 div 元素设置背景图片(中间的空格表示层级)。

示例四：向页面添加自定义样式属性，然后使用 JQuery 的 hasClass、addClass、removeClass、toggleClass 方法操作目标元素的样式。
    GM_addStyle(".myClass {border: 3px dotted green;background-color: red;}");
    $("#main_nav").addClass("myClass");

示例五：将含有指定属性的div元素设置为不可见。
    GM_addStyle("div[align='center'],div[class='nav_bar wrap'] {display:none !important}");

@grant GM_notification

设置网页通知/提示。

GM_notification(details, ondone)

GM_notification(text, title, image, onclick)

@grant window.close

@grant window.focus

// @grant GM_registerMenuCommand

注册菜单命令，浏览器油猴插件展示脚本名称时，会携带此菜单，方便用户做一些设置，而不用手动修改脚本。

function switchLanguage(){
    // 函数内容
}
GM_registerMenuCommand("语言切换", switchLanguage);
GM_registerMenuCommand("自定义設置", () => {
    window.open("https://xxx.xxx.xxx/xxx", "_blank");
});

@grant GM_openInTab

// GM_openInTab(url, options)

打开一个新的标签页面，类似 windown.open(url)。

url：指定打开的新 URL 地址；

options：指定页面展示方式及焦点停留页面。
GM_openInTab("https://www.baidu.com",{ active: true, setParent :true});

// active:true，新标签页获取页面焦点
// setParent :true:新标签页面关闭后，焦点重新回到源页面

添加新脚本
安装好油猴插件之后，在浏览器右上角找到并点击油猴插件，选择添加新脚本。
然后在打开的编辑器窗口中可以编辑自己的脚本文件，还可以将脚本内容复制到合适的编辑器中编辑，完成之后再复制回来。
将自己的脚本编写到 // your code here .. 那里，可以编写函数，然后在最后调用这几个函数，这样的模块化编写方法写出来的脚本比较容易维护。
自定义网页倒计时
演示脚本：greasyfork.org/zh-CN/scripts/457839-网页自定义倒计时。
调试油猴脚本：
一是最原始的打印日志，可以利用 console.log(xxx) 和 gm_log(xxx) 来将关键信息打印出来。
二是在脚本需要调试的地方插入 debugger; 语句，然后F12开发者工具调试。
网页浏览离开黑屏保护
网页一定时间内没有浏览时，自动黑屏保护，即使是刷新或者关闭浏览器重开也会持续保持黑屏。必须输入正确的密码后才能继续正常浏览。 
网页浏览离开黑屏保护。
微博视频下载助手
1、浏览微博视频时，自动在视频上边展示【下载】按钮，点击按钮即可下载对应的视频，方便快捷。

2、greasyfork.org/zh-CN/scripts/458716-微博视频下载助手。

华为云工作项列表突出展示工作项
https://greasyfork.org/zh-CN/scripts/459871-华为云工作项列表突出展示工作项。

Greasy Fork 发布脚本
脚本功能没有问题以后，可以分享出来一起使用的，比如可以分享到 gitee、github 等等。
油猴官方支持好几个网站，其中使用最频繁的是 GreasyFork (油叉) ，操作也很简单，纯中文，按着提示操作即可。
右上角点击'登录'(可以使用github账号登陆)。新账号登陆后，需要过30分钟左右后才能正式发布脚本。
登陆之后，点击用户名称进入控制台，选择'发布你编写的脚本'，最后添加内容即可，发布时需要指定 @license 许可证。
@namespace 不写时会默认自动生成，这样油猴管理面版中点击主页按钮即可跳转到此地址。
@updateurl 不指定时也可以使用@homepage设置脚本更新地址。

————————————————
版权声明：本文为CSDN博主「蚩尤后裔」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
原文链接：https://blog.csdn.net/wangmx1993328/article/details/128649406

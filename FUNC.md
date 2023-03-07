# 此Proxy可以部署到腾讯云函数

① 进入[云函数创建面板](https://console.cloud.tencent.com/scf/list-create?rid=5&ns=default&createType=empty)，选择中国香港、web函数、NodeJS 16。

![](images/20230307122958.png)

② 在函数代码处点击`app.js`将本项目 [app.js](/app.js) 的代码粘贴进去。

![](images/20230307123053.png)

其他不用改，点创建。

③ 创建完成后，点击「函数管理」→「函数代码」。等编辑器把函数代码加载完成后 CloudStudio → 终端 → 新终端，打开一个新终端。

![](images/20230307123511.png)

④ 在出现的终端中粘贴以下代码 

```bash
cd src && yarn add body-parser@1.20.2 cross-fetch@3.1.5 eventsource-parser@0.1.0 express@4.18.2 multer@1.4.5-lts.1
```

![](images/20230307123910.png)

⑤ 点编辑器右上角的「部署」，等待部署完成。

![](images/20230307123957.png)

⑥ 把编辑器往下拉，「访问路径」就是代理API的URL了。

![](images/20230307124127.png)
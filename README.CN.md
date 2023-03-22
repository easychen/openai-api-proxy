> ⚠️ 这是代理的服务器端，不是客户端。需要部署到可以联通 openai api 的网络环境后访问。

## NodeJS部署

你可以把 ./app.js 部署到所有支持 nodejs 14+ 的环境，比如云函数和边缘计算平台。

1. 复制 app.js 和 package.json 到目录 
1. yarn install 安装依赖
1. node app.js 启动服务

## Docker部署 

```
docker run -p 9000:9000 easychen/ai.level06.com:latest
```

Proxy地址为 http://${IP}:9000

### 可用环境变量

1. PORT: 服务端口
1. PROXY_KEY: 代理访问KEY，用于限制访问
1. TIMEOUT：请求超时时间，默认5秒

## 接口使用方法

1. 将 openai 的请求地址（ https://api.openai.com ）变更为本 proxy 的地址加上 "v1"（ 不带斜杠 ）
   - 举例： `http://${IP}:9000/v1`
2. 如果设置了PROXY_KEY，在 openai 的 key 后加上 `:<PROXY_KEY>`，如果没有设置，则不需修改

## 说明 

1. 只支持 GET 和 POST 方法的接口，不支持文件相关接口
1. ~~当前不支持SSE，因此需要关掉 stream 相关的选项~~ 已支持

## 客户端使用实例

以 `https://www.npmjs.com/package/chatgpt` 为例

```js
chatApi= new gpt.ChatGPTAPI({
    apiKey: 'sk.....:<proxy_key写这里>',
    apiBaseUrl: "http://localhost:9001/v1", // 传递代理地址
});
   
```

## 致谢

1. SSE参考了[chatgpt-api项目相关代码](https://github.com/transitive-bullshit/chatgpt-api/blob/main/src/fetch-sse.ts)
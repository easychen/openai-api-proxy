## Docker 

```
docker run -p 9000:9000 easychen/ai.level06.com:latest
```

Proxy地址为 http://${IP}:9000

### 可用环境变量

1. PORT: 服务端口
1. PROXY_KEY: 代理访问KEY，用于限制访问
1. TIMEOUT：请求超时时间，默认5秒

## 接口使用方法

1. 将 openai 的请求地址（ https://api.openai.com ）变更为本 proxy 的地址（ 不带斜杠 ）
1. 如果设置了PROXY_KEY，在 openai 的 key 后加上 `:<PROXY_KEY>`，如果没有设置，则不需修改

## 说明 

1. 只支持 GET 和 POST 方法的接口，不支持文件相关接口
1. 当前不支持SSE，因此需要关掉 stream 相关的选项

## 客户端使用实例

以 `https://www.npmjs.com/package/chatgpt` 为例

```js
chatApi= new gpt.ChatGPTAPI({
    apiKey: 'sk.....:<proxy_key写这里>',
    apiBaseUrl: "http://localhost:9001", // 传递代理地址
});

const ret = await chatApi.sendMessage(text, {"onProgress":null}); // 不要实现 onProgress，否则会报错           
```
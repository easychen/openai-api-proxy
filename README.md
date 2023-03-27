# openai-api-proxy

可以部署到docker和云函数的OpenAI API代理
Simple proxy for OpenAi api via a one-line docker command

🎉 已经支持SSE，可以实时返回内容 💪 [支持流式内容文本安全](./stream-moderation.mov)

- [腾讯云函数部署教程](FUNC.md)
- [简体中文使用说明](README.CN.md)
- [《如何快速开发一个OpenAI/GPT应用：国内开发者笔记》](https://github.com/easychen/openai-gpt-dev-notes-for-cn-developer)

以下英文由GPT翻译。The following English was translated by GPT.

  ⚠️ This is the server-side of the proxy, not the client-side. It needs to be deployed to a network environment that can access the openai api.

## Features

1. Supports SSE streaming output
2. Built-in text moderation (requires Tencent Cloud KEY configuration)
3. 💪 SSE streaming output supports text moderation, that's how powerful it is.

## NodeJS Deployment

You can deploy ./app.js to any environment that supports nodejs 14+, such as cloud functions and edge computing platforms.

1. Copy app.js and package.json to the directory
2. Install dependencies with yarn install
3. Start the service with node app.js

## Docker Deployment

```
docker run -p 9000:9000 easychen/ai.level06.com:latest
```

The proxy address is http://${IP}:9000

### Available Environment Variables

1. PORT: Service port
2. PROXY_KEY: Proxy access key, used to restrict access
3. TIMEOUT: Request timeout, default 30 seconds
4. TENCENT_CLOUD_SID: Tencent Cloud secret_id
5. TENCENT_CLOUD_SKEY: Tencent Cloud secret_key
6. TENCENT_CLOUD_AP: Tencent Cloud region (e.g. ap-singapore Singapore)

## API Usage

1. Change the domain/IP (with port number) of the openai request address in the original project (e.g. https://api.openai.com) to the domain/IP of this proxy.
2. If PROXY_KEY is set, add `:<PROXY_KEY>` after the openai key. If not set, no modification is required.
3. moderation: true enables moderation, false disables moderation
4. moderation_level: high interrupts all sentences whose moderation result is not Pass, low only interrupts sentences whose moderation result is Block.

## Notes

1. Only supports GET and POST methods, not file-related interfaces.
2. ~~SSE is not currently supported, so stream-related options need to be turned off~~ Now supported.

## Client-side Usage Example

Using `https://www.npmjs.com/package/chatgpt` as an example:

```js
chatApi= new gpt.ChatGPTAPI({
    apiKey: 'sk.....:<proxy_key_here>',
    apiBaseUrl: "http://localhost:9001/v1", // Replace with proxy domain/IP
});
   
```

## Acknowledgements

1. SSE reference to [chatgpt-api project related code](https://github.com/transitive-bullshit/chatgpt-api/blob/main/src/fetch-sse.ts)

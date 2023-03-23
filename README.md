# openai-api-proxy

可以部署到docker和云函数的OpenAI API代理
Simple proxy for OpenAi api via a one-line docker command

🎉 已经支持SSE，可以实时返回内容

- [腾讯云函数部署教程](FUNC.md)
- [简体中文使用说明](README.CN.md)
- [《如何快速开发一个OpenAI/GPT应用：国内开发者笔记》](https://github.com/easychen/openai-gpt-dev-notes-for-cn-developer)

以下英文由GPT翻译。The following English was translated by GPT.

 ## NodeJS Deployment

You can deploy ./app.js to any environment that supports nodejs 14+, such as cloud functions and edge computing platforms.

1. Copy app.js and package.json to the directory
2. Install dependencies with yarn install
3. Start the service with node app.js

## Docker Deployment

```
docker run -p 9000:9000 easychen/ai.level06.com:latest
```

Proxy address is http://${IP}:9000

### Available Environment Variables

1. PORT: Service port
2. PROXY_KEY: Proxy access key, used to restrict access
3. TIMEOUT: Request timeout, default 5 seconds

## Interface Usage

1. Change the domain name/IP (with port number) of the original openai request address (such as https://api.openai.com) to the domain name/IP of this proxy
2. If PROXY_KEY is set, add `:<PROXY_KEY>` after the openai key. If not set, no modification is required.

## Notes

1. Only GET and POST method interfaces are supported, and file-related interfaces are not supported.
2. ~~SSE is not currently supported, so the stream-related options need to be turned off~~ Supported now.

## Client Usage Example

Taking `https://www.npmjs.com/package/chatgpt` as an example:

```js
chatApi= new gpt.ChatGPTAPI({
    apiKey: 'sk.....:<proxy_key_here>',
    apiBaseUrl: "http://localhost:9001/v1", // Replace with proxy domain name/IP
});
   
```

## Acknowledgments

1. SSE reference to [chatgpt-api project related code](https://github.com/transitive-bullshit/chatgpt-api/blob/main/src/fetch-sse.ts)


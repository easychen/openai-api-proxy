# openai-api-proxy

Simple proxy for OpenAi api via a one-line docker command

[简体中文](README.CN.md)

以下英文由GPT翻译。The following English was translated by GPT.

## Docker

```
docker run -p 9000:9000 easychen/ai.level06.com:latest
```

The proxy address is http://${IP}:9000.

### Available Environment Variables

1. PORT: Service port.
2. PROXY_KEY: Proxy access key used to restrict access.
3. TIMEOUT: Request timeout, default is 5 seconds.

## Usage of the API

1. Change the request address of OpenAI (https://api.openai.com) to the address of this proxy (without a slash).
2. If PROXY_KEY is set, add `:<PROXY_KEY>` after the OpenAI key. If not set, no modification is required.

## Explanation

1. Only GET and POST method interfaces are supported, and file-related interfaces are not supported.
2. ~~SSE is currently not supported, so stream-related options need to be turned off.~~ SSE is OK now.

## Example of Client Usage

Take `https://www.npmjs.com/package/chatgpt` as an example.

```js
chatApi= new gpt.ChatGPTAPI({
    apiKey: 'sk.....:<proxy_key here>',
    apiBaseUrl: "http://localhost:9001", // Pass the proxy address
});

```


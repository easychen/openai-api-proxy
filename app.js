const express = require('express')
const fetch = require('cross-fetch')
const app = express()
var multer = require('multer');
var forms = multer({limits: { fieldSize: 10*1024*1024 }});
app.use(forms.array()); 
const cors = require('cors');
app.use(cors());

const bodyParser = require('body-parser')
app.use(bodyParser.json({limit : '50mb' }));  
app.use(bodyParser.urlencoded({ extended: true }));

const tencentcloud = require("tencentcloud-sdk-nodejs");
const TmsClient = tencentcloud.tms.v20201229.Client;
const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_CLOUD_SID,
    secretKey: process.env.TENCENT_CLOUD_SKEY,
  },
  region: process.env.TENCENT_CLOUD_AP||"ap-singapore",
  profile: {
    httpProfile: {
      endpoint: "tms.tencentcloudapi.com",
    },
  },
};
const mdClient = process.env.TENCENT_CLOUD_SID && process.env.TENCENT_CLOUD_SKEY ? new TmsClient(clientConfig) : false;

const controller = new AbortController();

app.all(`*`, async (req, res) => {
  const url = `https://api.openai.com${req.url}`;
  // 从 header 中取得 Authorization': 'Bearer 后的 token
  const token = req.headers.authorization?.split(' ')[1];
  if( !token ) return res.status(403).send('Forbidden');

  const openai_key = token.split(':')[0];
  if( !openai_key ) return res.status(403).send('Forbidden');

  const proxy_key = token.split(':')[1]||"";  
  if( process.env.PROXY_KEY && proxy_key !== process.env.PROXY_KEY ) 
    return res.status(403).send('Forbidden');

  // console.log( req );
  const { moderation, moderation_level, ...restBody } = req.body;
  let sentence = "";
  // 建立一个句子缓冲区
  let sentence_buffer = [];
  let processing = false;
  let processing_stop = false;

  async function process_buffer(res)
  {
    if( processing_stop )
    {
      console.log("processing_stop",processing_stop);
      return false;
    }

    console.log("句子缓冲区" + new Date(), sentence_buffer);
    
    // 处理句子缓冲区
    if( processing )
    {
      // 有正在处理的，1秒钟后重试
      console.log("有正在处理的，1秒钟后重试");
      setTimeout( () => process_buffer(res), 1000 );
      return false;
    }
    
    processing = true;
    const sentence = sentence_buffer.shift();
    console.log("取出句子", sentence);
    if( sentence )
    {
      if( sentence === '[DONE]' )
      {
        console.log("[DONE]", "结束输出");
        res.write("data: "+sentence+"\n\n" );
        processing = false;
        res.end();
        return true;
      }else
      {
        // 开始对句子进行审核
        let data_array = JSON.parse(sentence);
        console.log("解析句子数据为array",data_array);

        const sentence_content = data_array.choices[0]?.delta?.content;
        console.log("sentence_content", sentence_content);
        if( sentence_content )
        {
          const params = {"Content": Buffer.from(sentence_content).toString('base64')};  
          const md_result = await mdClient.TextModeration(params);
          // console.log("审核结果", md_result);
          let md_check = moderation_level == 'high' ? md_result.Suggestion != 'Pass' : md_result.Suggestion == 'Block';
          if( md_check )
          {
            // 终止输出
            console.log("审核不通过", sentence_content, md_result);
            let forbidden_array = data_array;
            forbidden_array.choices[0].delta.content = "这个话题不适合讨论，换个话题吧。";
            res.write("data: "+JSON.stringify(forbidden_array)+"\n\n" );
            res.write("data: [DONE]\n\n" );
            res.end();
            controller.abort();
            processing = false;
            processing_stop = true;
            return false;
          }else
          {
            console.log("审核通过", sentence_content);
            res.write("data: "+sentence+"\n\n" );
            processing = false;
            console.log("processing",processing);
            return true;
          }
        }

      }
    }else
    {
      // console.log("句子缓冲区为空");
    }

    processing = false;
  }

  
  const options = {
      method: req.method,
      timeout: process.env.TIMEOUT||30000,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer '+ openai_key,
      },
      onMessage: async (data) => {
        // console.log(data);
        if( data === '[DONE]' )
        {
          sentence_buffer.push(data);
          await process_buffer(res);  
        }else
        {
          if( moderation && mdClient )
          {
            try {
              let data_array = JSON.parse(data);
              const char = data_array.choices[0]?.delta?.content;
              if( char ) sentence += char;
              // console.log("sentence",sentence );
              if( char == '。' || char == '？' || char == '！' || char == "\n" )
              {
                // 将 sentence 送审
                console.log("遇到句号，将句子放入缓冲区", sentence);
                data_array.choices[0].delta.content = sentence;
                sentence = "";
                sentence_buffer.push(JSON.stringify(data_array));
                await process_buffer(res);
              }
            } catch (error) {
              // 因为开头已经处理的了 [DONE] 的情况，这里应该不会出现无法解析json的情况 
              console.log( "error", error );
            }   
          }else
          {
            // 如果没有文本审核参数或者设置，直接输出
            res.write("data: "+data+"\n\n" );  
          }
        }
      }
  };
  
  if( req.method.toLocaleLowerCase() === 'post' && req.body ) options.body = JSON.stringify(restBody);
  // console.log({url, options});

  try {
    
    // 如果是 chat completion 和 text completion，使用 SSE
    if( (req.url.startsWith('/v1/completions') || req.url.startsWith('/v1/chat/completions')) && req.body.stream ) {
      console.log("使用 SSE");
      const response = await myFetch(url, options);
      if( response.ok )
      {
        // write header
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        const  { createParser } = await import("eventsource-parser");
        const parser = createParser((event) => {
          // console.log(event);    
          if (event.type === "event") {
            options.onMessage(event.data);
          }
        });
        if (!response.body.getReader) {
          const body = response.body;
          if (!body.on || !body.read) {
            throw new error('unsupported "fetch" implementation');
          }
          body.on("readable", () => {
            let chunk;
            while (null !== (chunk = body.read())) {
              // console.log(chunk.toString());
              parser.feed(chunk.toString());
            }
          });
        } else {
          for await (const chunk of streamAsyncIterable(response.body)) {
            const str = new TextDecoder().decode(chunk);
            parser.feed(str);
          }
        }
      }
      
    }else
    {
      console.log("使用 fetch");
      const response = await myFetch(url, options);
      // console.log(response);
      const data = await response.json();
      // 审核结果
      if( moderation && mdClient )
      {
        const params = {"Content": Buffer.from(data.choices[0].message.content).toString('base64')};  
        const md_result = await mdClient.TextModeration(params);
        // console.log("审核结果", md_result);
        let md_check = moderation_level == 'high' ? md_result.Suggestion != 'Pass' : md_result.Suggestion == 'Block';
        if( md_check )
        {
          // 终止输出
          console.log("审核不通过", data.choices[0].message.content, md_result);
          data.choices[0].message.content = "这个话题不适合讨论，换个话题吧。";
        }else
        {
          console.log("审核通过", data.choices[0].message.content);
        }
      }

      res.json(data);
    }
    
    
  } catch (error) {
    console.error(error);
    res.status(500).json({"error":error.toString()});  
  }
})

async function* streamAsyncIterable(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

async function myFetch(url, options) {
  const {timeout, ...fetchOptions} = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout||30000)
  const res = await fetch(url, {...fetchOptions,signal:controller.signal});
  clearTimeout(timeoutId);
  return res;
}

// Error handler
app.use(function(err, req, res, next) {
  console.error(err)
  res.status(500).send('Internal Serverless Error')
})

const port = process.env.PORT||9000;
app.listen(port, () => {
  console.log(`Server start on http://localhost:${port}`);
})
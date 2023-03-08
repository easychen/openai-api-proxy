const express = require('express')
const path = require('path')
const fetch = require('cross-fetch')
const app = express()
var multer = require('multer');
var forms = multer({limits: { fieldSize: 10*1024*1024 }});
app.use(forms.array()); 

const bodyParser = require('body-parser')
app.use(bodyParser.json({limit : '50mb' }));  
app.use(bodyParser.urlencoded({ extended: true }));

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

    //console.log( req );

  
  const options = {
      method: req.method,
      timeout: process.env.TIMEOUT||30000,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer '+ openai_key,
      },
      onMessage: (data) => {
        // console.log(data);
        res.write("data: "+data+"\n\n" );
        if( data === '[DONE]' )
        {
          res.end();
        } 
      }
  };
  
  if( req.method.toLocaleLowerCase() === 'post' && req.body ) options.body = JSON.stringify(req.body);
  // console.log({url, options});

  try {
    
    // 如果是 chat completion 和 text completion，使用 SSE
    if( (req.url.startsWith('/v1/completions') || req.url.startsWith('/v1/chat/completions')) && req.body.stream ) {
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
      const response = await myFetch(url, options);
      console.log(response);
      const data = await response.json();
      console.log( data );
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

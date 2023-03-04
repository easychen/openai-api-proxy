const express = require('express')
const path = require('path')
const fetch = require('cross-fetch')
const app = express()
var multer = require('multer');
var forms = multer({limits: { fieldSize: 10*1024*1024 }});
app.use(forms.array()); 
const uuidv4 = require('uuid').v4;


const bodyParser = require('body-parser')
app.use(bodyParser.json({limit : '50mb' }));  
app.use(bodyParser.urlencoded({ extended: true }));

const fetchSSE = require('./fetchsse.js');


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

  
  const options = {
      method: req.method,
      timeout: process.env.TIMEOUT||5000,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Bearer '+ openai_key,
    },
    onProgress: (data) => {
      console.log(data);
    }
  };
  
  if( req.method.toLocaleLowerCase() === 'post' && req.body ) options.body = JSON.stringify(req.body);
  console.log({url, options});

  try {
    const response = await myFetch(url, options);
    console.log(response);
    const data = await response.json();
    console.log( data );
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({"error":error.toString()});  
  }
})

async function myFetch(url, options) {
  const {timeout, ...fetchOptions} = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout||5000);
  
  const responseP =  new Promise(
    async (resolve, reject) =>{
      if( false && options.onProgress ) // stream
      {
        const result = {
          role: "assistant",
          id: uuidv4(),
          parentMessageId: messageId,
          text: ""
        };
        fetchSSE(
          url,
          {
            ...fetchOptions,
            onMessage: (data) => {
              var _a2;
              if (data === "[DONE]") {
                result.text = result.text.trim();
                return resolve(result);
              }
              try {
                const response = JSON.parse(data);
                if (response.id) {
                  result.id = response.id;
                }
                if ((_a2 = response == null ? void 0 : response.choices) == null ? void 0 : _a2.length) {
                  const delta = response.choices[0].delta;
                  if (delta == null ? void 0 : delta.content) {
                    result.delta = delta.content;
                    result.text += delta.content;
                    result.detail = response;
                    if (delta.role) {
                      result.role = delta.role;
                    }
                    onProgress == null ? void 0 : onProgress(result);
                  }
                }
              } catch (err) {
                console.warn("OpenAI stream SEE event unexpected error", err);
                return reject(err);
              }
            }
          },
          this._fetch
        ).catch(reject);

      }else
      {
        const res = await fetch(url, {...fetchOptions,signal:controller.signal});
        resolve(res);
      }
  });
  
  
  // const res = options.onProgress ?  await fetchSSE( url, {...fetchOptions,signal:controller.signal}, fetch  )  : await fetch(url, {...fetchOptions,signal:controller.signal});
  clearTimeout(timeoutId);
  return responseP;
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
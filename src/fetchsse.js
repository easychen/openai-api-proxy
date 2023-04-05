async function * streamAsyncIterable (stream) {
  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        return
      }
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}

// add timeout to fetchSSE
async function fetchSSE (url, options, fetch2 = fetch) {
  const { createParser } = await import('eventsource-parser')
  const { onMessage, timeout, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout || 30000)

  const res = await fetch2(url, { ...fetchOptions, signal: controller.signal })
  clearTimeout(timeoutId)

  if (!res.ok) {
    let reason
    try {
      reason = await res.text()
    } catch (err) {
      reason = res.statusText
    }
    const msg = `ChatGPT error ${res.status}: ${reason}`
    const error = new Error(msg, { cause: res })
    error.statusCode = res.status
    error.statusText = res.statusText
    error.context = { url, options }
    throw error
  }
  const parser = createParser((event) => {
    if (event.type === 'event') {
      onMessage(event.data)
    }
  })
  if (!res.body.getReader) {
    const body = res.body
    if (!body.on || !body.read) {
      throw new Error('unsupported "fetch" implementation')
    }
    body.on('readable', () => {
      let chunk
      while ((chunk = body.read()) !== null) {
        parser.feed(chunk.toString())
      }
    })
  } else {
    for await (const chunk of streamAsyncIterable(res.body)) {
      const str = new TextDecoder().decode(chunk)
      parser.feed(str)
    }
  }
}

module.exports = fetchSSE

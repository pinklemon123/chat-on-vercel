// Edge Runtime：从 DeepSeek SSE 读取并仅输出 delta.content 的纯文本流
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const { messages, model = 'deepseek-chat' } = await req.json();

  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: messages ?? [{ role: 'user', content: '你好' }]
    })
  });

  if (!upstream.ok || !upstream.body) {
    return new Response('Upstream error', { status: 502 });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE 事件以 \n\n 分隔；逐段取出
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const event = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);

            // 仅处理 data: 行
            const dataLine = event.split('\n').find(l => l.startsWith('data:'));
            if (!dataLine) continue;

            const payload = dataLine.slice(5).trim();
            if (payload === '[DONE]') { controller.close(); return; }

            try {
              const js = JSON.parse(payload);
              const piece = js?.choices?.[0]?.delta?.content ?? '';
              if (piece) controller.enqueue(encoder.encode(piece));
            } catch {
              // 忽略非 JSON 心跳等
            }
          }
        }
      } catch {
        // 读流异常时尽量优雅关闭
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

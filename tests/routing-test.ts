import worker from '../index';

async function testRouting() {
  const env = {
    ASSETS: {
      fetch: async (req: Request) => {
        return new Response(`Serving asset: ${new URL(req.url).pathname}`, { status: 200 });
      }
    }
  };

  console.log('--- Testing /ui (no slash) routing ---');
  const uiReq = new Request('http://localhost/ui');
  const uiRes = await worker.fetch(uiReq, env, {});
  console.log(`Path: /ui -> Status: ${uiRes.status}, Location: ${uiRes.headers.get('location')}`);

  console.log('\n--- Testing /ui/ (with slash) fall-through ---');
  const uiSlashReq = new Request('http://localhost/ui/');
  const uiSlashRes = await worker.fetch(uiSlashReq, env, {});
  const uiSlashText = await uiSlashRes.text();
  console.log(`Path: /ui/ -> Result (Should be API error): ${uiSlashText.substring(0, 50)}...`);

  console.log('\n--- Testing root (/) conversion API ---');
  const apiReq = new Request('http://localhost/?proxies=test');
  const apiRes = await worker.fetch(apiReq, env, {});
  console.log(`Path: /?proxies=test -> Content-Type: ${apiRes.headers.get('content-type')}`);

  console.log('\n--- Testing root (/) without params ---');
  const rootReq = new Request('http://localhost/');
  const rootRes = await worker.fetch(rootReq, env, {});
  const rootText = await rootRes.text();
  console.log(`Path: / -> Result: ${rootText.substring(0, 50)}...`);
}

testRouting().catch(console.error);

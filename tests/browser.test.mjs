import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createFixture} from '../src/fixture.mjs';
import {HTML} from '../src/browser-ui.mjs';

for(const viewport of [
  {label:'desktop',width:1280,height:800},
  {label:'mobile',width:390,height:844}
]){
  test('Chromium '+viewport.label+' synthetic search and data isolation',async()=>{
    const f=createFixture();
    const browser=await chromium.launch({headless:true});
    try{
      const context=await browser.newContext({
        viewport:{width:viewport.width,height:viewport.height}
      });
      const page=await context.newPage();
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/*',route=>route.abort('blockedbyclient'));
      await page.route('https://qa-fixture.example/**',async route=>{
        const url=new URL(route.request().url());
        if(url.pathname!=='/api/search'){
          await route.fulfill({status:404,body:'not found'});return;
        }
        const response=f.query(url.searchParams.get('q'));
        await route.fulfill({
          status:response.status,
          contentType:'application/json',
          headers:{'access-control-allow-origin':'*','cache-control':'no-store'},
          body:JSON.stringify(response.body)
        });
      });
      await page.setContent(HTML,{waitUntil:'domcontentloaded'});
      await page.locator('#q').fill('Cedar');
      await page.getByRole('button',{name:'Search'}).click();
      await page.getByRole('status').getByText('Found 1').waitFor();
      assert.match(await page.locator('#results').innerText(),/Hotel Cedar/);
      assert.equal((await page.locator('#results').innerText()).includes('PRIVATE_CANARY'),false);
      await page.locator('#q').fill('foo; DROP TABLE hotels;');
      await page.getByRole('button',{name:'Search'}).click();
      await page.getByRole('status').getByText('Invalid query').waitFor();
      assert.equal(await page.locator('#results li').count(),0);
      assert.deepEqual(errors,[]);
      await context.close();
    }finally{
      await browser.close();
      f.close();
    }
  });
}

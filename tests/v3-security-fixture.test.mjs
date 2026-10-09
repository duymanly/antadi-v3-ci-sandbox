import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair, SignJWT, jwtVerify} from 'jose';

const encoder = new TextEncoder();

test('synthetic jose RS256 signing and verification works without real OAuth secrets', async()=>{
  const {privateKey, publicKey}=await generateKeyPair('RS256');
  const token=await new SignJWT({role:'fixture-user',scope:'qa'})
    .setProtectedHeader({alg:'RS256'})
    .setIssuer('antadi-public-qa-fixture')
    .setAudience('antadi-v3-test')
    .setExpirationTime('5m')
    .sign(privateKey);
  const verified=await jwtVerify(token,publicKey,{issuer:'antadi-public-qa-fixture',audience:'antadi-v3-test'});
  assert.equal(verified.payload.role,'fixture-user');
  assert.equal(verified.payload.scope,'qa');
});

test('fixture never accepts production-looking secrets',()=>{
  const fixture=JSON.stringify({clientSecret:null,oauthSecret:null,cloudflareToken:null});
  for(const key of ['PRIVATE_KEY','GOOGLE_CLIENT_SECRET','CLOUDFLARE_API_TOKEN'])
    assert.equal(fixture.includes(key),false);
});

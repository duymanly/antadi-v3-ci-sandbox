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

test('synthetic RS256 rejects a token verified with an unrelated public key',async()=>{
  const signer=await generateKeyPair('RS256');
  const attacker=await generateKeyPair('RS256');
  const token=await new SignJWT({sub:'fictional-user-a'})
    .setProtectedHeader({alg:'RS256'})
    .setIssuer('antadi-public-qa-fixture')
    .setAudience('antadi-v3-test')
    .setExpirationTime('5m')
    .sign(signer.privateKey);
  await assert.rejects(jwtVerify(token,attacker.publicKey,{
    issuer:'antadi-public-qa-fixture',audience:'antadi-v3-test'
  }));
  const verified=await jwtVerify(token,signer.publicKey,{
    issuer:'antadi-public-qa-fixture',audience:'antadi-v3-test'
  });
  assert.equal(verified.payload.sub,'fictional-user-a');
});

test('synthetic RS256 refuses mismatched issuer and audience claims',async()=>{
  const {privateKey,publicKey}=await generateKeyPair('RS256');
  const token=await new SignJWT({sub:'fictional-user-b'})
    .setProtectedHeader({alg:'RS256'})
    .setIssuer('antadi-public-qa-fixture')
    .setAudience('antadi-v3-test')
    .setExpirationTime('5m')
    .sign(privateKey);
  await assert.rejects(jwtVerify(token,publicKey,{
    issuer:'untrusted-fixture-issuer',audience:'antadi-v3-test'
  }));
  await assert.rejects(jwtVerify(token,publicKey,{
    issuer:'antadi-public-qa-fixture',audience:'different-audience'
  }));
});

test('synthetic RS256 rejects expired and tampered tokens',async()=>{
  const {privateKey,publicKey}=await generateKeyPair('RS256');
  const expired=await new SignJWT({sub:'fictional-user-c'})
    .setProtectedHeader({alg:'RS256'})
    .setIssuer('antadi-public-qa-fixture')
    .setAudience('antadi-v3-test')
    .setIssuedAt(1)
    .setExpirationTime(2)
    .sign(privateKey);
  await assert.rejects(jwtVerify(expired,publicKey,{
    issuer:'antadi-public-qa-fixture',audience:'antadi-v3-test'
  }));
  const valid=await new SignJWT({sub:'fictional-user-c'})
    .setProtectedHeader({alg:'RS256'})
    .setIssuer('antadi-public-qa-fixture')
    .setAudience('antadi-v3-test')
    .setExpirationTime('5m')
    .sign(privateKey);
  const parts=valid.split('.');
  const payload=parts[1];
  parts[1]=(payload[0]==='A'?'B':'A')+payload.slice(1);
  await assert.rejects(jwtVerify(parts.join('.'),publicKey,{
    issuer:'antadi-public-qa-fixture',audience:'antadi-v3-test'
  }));
});

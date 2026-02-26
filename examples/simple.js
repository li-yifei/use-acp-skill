import { createClient } from '../src/index.js';

const client = await createClient({ cwd: process.cwd() });
const result = await client.prompt('Say hello in one sentence.');
console.log(result.text);
await client.close();

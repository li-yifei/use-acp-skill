import { createClient } from '../src/index.js';

const client = await createClient({ cwd: process.cwd() });

await client.promptStream('Say hello in two short lines.', (event) => {
  switch (event.type) {
    case 'text':
      process.stdout.write(event.text);
      break;
    case 'tool_call':
      console.log(`\n[tool] ${event.title} (${event.status})`);
      break;
    case 'done':
      console.log(`\n[done] ${event.stopReason}`);
      break;
    default:
      break;
  }
});

await client.close();

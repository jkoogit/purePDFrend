import fs from 'fs';
import path from 'path';

const storePath = path.resolve('data/local_agent_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

store.sessions = store.sessions.filter((s: any) => !s.session_id.startsWith('SESSION-TEST'));
store.tasks = store.tasks.filter((t: any) => !t.task_id.startsWith('TASK-TEST'));
store.loops = store.loops.filter((l: any) => !l.loop_id.startsWith('LOOP-TEST'));

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('✅ Cleaned test sessions/tasks/loops from local store. Active session is now:', store.sessions[0]?.session_id);

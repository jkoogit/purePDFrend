import '../src/shared/envLoader';
import fs from 'fs';
import { execSync } from 'child_process';

console.log('.git exists:', fs.existsSync('.git'));
try {
  const remotes = execSync('git remote -v', { encoding: 'utf8' });
  console.log('Remotes:\n', remotes);
  const status = execSync('git status', { encoding: 'utf8' });
  console.log('Status:\n', status);
  const branch = execSync('git branch -a', { encoding: 'utf8' });
  console.log('Branches:\n', branch);
} catch (e: any) {
  console.log('Git error:', e.message);
}

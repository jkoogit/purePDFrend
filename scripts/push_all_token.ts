import '../src/shared/envLoader';
import { execSync } from 'child_process';

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.log('No GITHUB_TOKEN');
  process.exit(0);
}

const url = `https://x-access-token:${token.trim()}@github.com/jkoogit/purePDFrend.git`;
execSync(`git -c credential.helper= push "${url}" task/0032_01_wireframe_tokens_phase2_Gemini:refs/heads/task/0032_01_wireframe_tokens_phase2_Gemini dev:refs/heads/dev stg:refs/heads/stg main:refs/heads/main`, { stdio: 'inherit', timeout: 20000 });
console.log('✅ Pushed all branches to remote!');

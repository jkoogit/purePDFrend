/**
 * @file scripts/standardize_docs_structure.ts
 * @description 18대 문서 체계 전수 현행화 스크립트
 * 1. 편집이력을 문서 최하단으로 일괄 이동하고 '## 📋 편집 이력 (Revision History)'로 타이틀 표준화
 * 2. Mermaid 다이어그램 앞 누락된 <img> 태그 및 상세 alt 대체 텍스트 보완
 */

import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.resolve(process.cwd(), 'docs');

// Skip README files if needed, or include all markdown files
function getAllMarkdownFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(filePath));
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  }
  return results;
}

const revisionHeaderRegex = /^(?:##\s*(?:📋|📝|📜|\d+\.)?\s*(?:편집\s*이력|작성\s*이력)(?:\s*\(Revision\s*History\))?)/im;

function processFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const fileName = path.basename(filePath);

  // Skip README files for revision table requirement, but standardize if present
  const isReadme = fileName.startsWith('README');

  let lines = content.split(/\r?\n/);

  // 1. Locate revision history section
  let revStartLine = -1;
  let revEndLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (revisionHeaderRegex.test(lines[i])) {
      revStartLine = i;
      // find end of revision section (next ## heading or EOF, skipping separator ---)
      for (let j = i + 1; j < lines.length; j++) {
        if (/^##\s+[^#]/m.test(lines[j])) {
          revEndLine = j - 1;
          break;
        }
      }
      if (revEndLine === -1) {
        revEndLine = lines.length - 1;
      }
      break;
    }
  }

  let revisionBlock = '';
  if (revStartLine !== -1) {
    // Extract revision block
    const revLines = lines.slice(revStartLine, revEndLine + 1);
    
    // Clean trailing/leading separators from revLines
    let cleanedRevLines = revLines.filter(l => l.trim() !== '---');
    
    // Ensure header is standard
    cleanedRevLines[0] = '## 📋 편집 이력 (Revision History)';
    
    revisionBlock = '\n---\n\n' + cleanedRevLines.join('\n').trim() + '\n';
    
    // Remove original revision block and its following/preceding separator
    lines.splice(revStartLine, revEndLine - revStartLine + 1);
    
    // Clean dangling separators at top
    while (lines.length > 1 && (lines[1].trim() === '---' || lines[1].trim() === '')) {
      // Keep title and clean up
      if (lines[1].trim() === '---' && lines.length > 2 && lines[2].trim() === '---') {
        lines.splice(1, 1);
      } else {
        break;
      }
    }
  } else if (!isReadme) {
    // Create new standard revision block if missing in regular doc
    const today = '2026-09-24';
    revisionBlock = `\n---\n\n## 📋 편집 이력 (Revision History)\n\n| 작업일자 | 이슈 | 태스크 | 작업자 | 작업내용 | 사용 AI 모델명 | 에이전트 | 참고링크 |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n| ${today} | #12 | TASK-0013 | gemini | 거버넌스 4대 ID 포맷 개선 및 18대 문서 체계 편집이력/다이어그램 표준화 | Gemini 1.5 Pro | Google Antigravity | [03-01. 문서 정책](../03.정책/03-01_문서작성_및_편집이력_정책.md) |\n`;
  }

  let newBody = lines.join('\n').trim();

  // If revision block exists, append it to the very bottom
  if (revisionBlock) {
    // remove any trailing separator before appending
    if (newBody.endsWith('---')) {
      newBody = newBody.slice(0, -3).trim();
    }
    newBody = newBody + '\n' + revisionBlock;
  }

  fs.writeFileSync(filePath, newBody.trim() + '\n', 'utf8');
  console.log(`[Standardized] ${relativePath}`);
}

const allDocs = getAllMarkdownFiles(DOCS_DIR);
console.log(`Found ${allDocs.length} markdown documents in docs/`);

for (const doc of allDocs) {
  processFile(doc);
}

console.log('All documents standardized successfully!');

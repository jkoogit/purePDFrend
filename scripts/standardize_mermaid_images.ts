/**
 * @file scripts/standardize_mermaid_images.ts
 * @description Mermaid 다이어그램 앞 <img> 렌더링 태그 및 상세 alt 대체 텍스트 자동 점검/보완 스크립트
 */

import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.resolve(process.cwd(), 'docs');

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

function processMermaidDoc(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const fileName = path.basename(filePath, '.md');

  if (!content.includes('```mermaid')) {
    return;
  }

  const lines = content.split(/\r?\n/);
  let newLines: string[] = [];
  let diagramCount = 0;
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```mermaid')) {
      diagramCount++;
      
      // Check if previous lines already contain <div align="center"> or <img
      let hasImageTag = false;
      for (let j = Math.max(0, i - 6); j < i; j++) {
        if (lines[j].includes('<img') || lines[j].includes('<div align="center">')) {
          hasImageTag = true;
          break;
        }
      }

      if (!hasImageTag) {
        // Generate contextual alt description based on document title / diagram number
        const docTitleMatch = content.match(/^#\s+(.+)$/m);
        const docTitle = docTitleMatch ? docTitleMatch[1].trim() : fileName;
        const diagramTitle = `${docTitle} - 아키텍처 및 상태 흐름도 다이어그램 ${diagramCount}`;
        const imageName = `${fileName}_diag_${diagramCount}.svg`;

        const imageBlock = [
          `<div align="center">`,
          `  <img src="./images/${imageName}" alt="${diagramTitle}" style="max-width: 100%; height: auto; border: 1px solid #334155; border-radius: 12px;" />`,
          `  <p><em>[그림] ${diagramTitle}</em></p>`,
          `</div>`,
          ``
        ];
        
        newLines.push(...imageBlock);
        modified = true;
        console.log(`[Added Mermaid Image Wrapper] ${relativePath} (Diagram #${diagramCount})`);
      }
    }

    newLines.push(line);
  }

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n').trim() + '\n', 'utf8');
  }
}

const allDocs = getAllMarkdownFiles(DOCS_DIR);
for (const doc of allDocs) {
  processMermaidDoc(doc);
}

console.log('Mermaid image wrappers checked and standardized!');

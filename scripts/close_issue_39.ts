import '../src/shared/envLoader';
import https from 'https';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ISSUE_NUMBER = 39;

function closeIssue(issueNumber: number): Promise<any> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      state: 'closed',
      state_reason: 'completed',
    });
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}/issues/${issueNumber}`, {
      method: 'PATCH',
      headers: {
        'User-Agent': 'NodeJS',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    req.write(payload);
    req.end();
  });
}

function addComment(issueNumber: number, comment: string): Promise<any> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ body: comment });
    const req = https.request(`https://api.github.com/repos/${OWNER}/${REPO}/issues/${issueNumber}/comments`, {
      method: 'POST',
      headers: {
        'User-Agent': 'NodeJS',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    req.write(payload);
    req.end();
  });
}

async function run() {
  const comment = `## ✅ [SESSION-0018] 세션 작업 완료 및 이슈 종결 보고
- **태스크 1**: TASK-0018-01 (사용자관리 프로필 크롭 연동, 인라인 정보수정 모드, 시스템 정책 연동 이메일·2FA 옵션화 및 비상 복구코드 10개 관리) [완료]
- **태스크 2**: TASK-0018-02 (토큰 소진 모니터링 기준 개선, AI Studio 2대 고유 에러 분류, KST 16:00 리셋 윈도우 적응형 쿼터 예측 API 구현 및 대화턴 6개 전수 무손실 Markdown 영속화) [완료]
- **문서화**: 운영정책 03-19 제정 및 코드리뷰 10-33, 10-34 발행 완결
- **배포 승급**: dev -> stg -> main 3대 원격 브랜치 100% 동일 SHA 배포 완료

모든 세션 목표가 정상 달성되었으므로 본 이슈를 성공적으로 종결합니다.`;

  console.log('Adding closing comment to Issue #' + ISSUE_NUMBER + '...');
  const cRes = await addComment(ISSUE_NUMBER, comment);
  console.log('Comment Status:', cRes.status);

  console.log('Closing Issue #' + ISSUE_NUMBER + '...');
  const closeRes = await closeIssue(ISSUE_NUMBER);
  console.log('Close Status:', closeRes.status, 'State:', closeRes.data?.state);
}

run().catch(console.error);

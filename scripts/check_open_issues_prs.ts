import '../src/shared/envLoader';
import https from 'https';

const OWNER = 'jkoogit';
const REPO = 'purePDFrend';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function getOpen(path: string): Promise<any> {
  return new Promise((resolve) => {
    https.get(`https://api.github.com/repos/${OWNER}/${REPO}/${path}?state=open`, {
      headers: {
        'User-Agent': 'NodeJS',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          resolve({ error: d });
        }
      });
    });
  });
}

async function check() {
  const [issues, pulls] = await Promise.all([
    getOpen('issues'),
    getOpen('pulls')
  ]);
  const realIssues = Array.isArray(issues) ? issues.filter(i => !i.pull_request) : [];
  const realPulls = Array.isArray(pulls) ? pulls : [];
  console.log('Open Issues Count:', realIssues.length);
  console.log('Open PRs Count   :', realPulls.length);
  if (realIssues.length > 0) console.log('Open Issues:', realIssues.map(i => ({ number: i.number, title: i.title })));
  if (realPulls.length > 0) console.log('Open PRs   :', realPulls.map(p => ({ number: p.number, title: p.title })));
}

check().catch(console.error);

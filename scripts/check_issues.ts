import '../src/shared/envLoader';
import https from 'https';

const token = process.env.GITHUB_TOKEN;
https.get('https://api.github.com/repos/jkoogit/purePDFrend/issues?state=open', {
  headers: { 'User-Agent': 'purePDFrend', 'Authorization': 'token ' + token }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const list = JSON.parse(d);
      console.log('Open issues:', list.map((i: any) => ({ number: i.number, title: i.title })));
    } catch (e: any) {
      console.log('Error parsing:', d);
    }
  });
});

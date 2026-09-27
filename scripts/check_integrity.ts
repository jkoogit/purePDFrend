async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/agent/audit/integrity');
    const data = await res.json();
    console.log('Integrity Audit Result:');
    console.log('Score:', data.integrityScore);
    console.log('Indicators:', JSON.stringify(data.indicators, null, 2));
  } catch (e: any) {
    console.error('Audit fetch error:', e.message);
  }
}
main();

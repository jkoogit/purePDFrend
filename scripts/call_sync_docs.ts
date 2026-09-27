async function main() {
  try {
    console.log('Calling /api/agent/docs/sync ...');
    const res = await fetch('http://localhost:3000/api/agent/docs/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text.slice(0, 300));
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}
main();

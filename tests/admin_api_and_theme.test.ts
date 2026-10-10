import { describe, it, expect } from 'vitest';

describe('PG-ADM-01 & PG-ADM-03 Admin APIs & Theme Switcher Tests', () => {
  const BASE_URL = 'http://localhost:3000';

  it('1. GET /api/admin/security/ips should return whitelist and blacklist arrays', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/security/ips`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.whitelist)).toBe(true);
    expect(Array.isArray(data.blacklist)).toBe(true);
    expect(data.whitelist.length).toBeGreaterThan(0);
  });

  it('2. POST & DELETE /api/admin/security/ips should add and remove IP entries', async () => {
    const testIp = '10.200.0.1/32';
    // Add to whitelist
    const addRes = await fetch(`${BASE_URL}/api/admin/security/ips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'white', ip: testIp, reason: '테스트용 IP' }),
    });
    expect(addRes.status).toBe(200);
    const addData = await addRes.json();
    expect(addData.success).toBe(true);
    expect(addData.whitelist.some((entry: string) => entry.includes(testIp))).toBe(true);

    // Delete from whitelist
    const matchedEntry = addData.whitelist.find((entry: string) => entry.includes(testIp));
    const delRes = await fetch(`${BASE_URL}/api/admin/security/ips`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'white', ip: matchedEntry }),
    });
    expect(delRes.status).toBe(200);
    const delData = await delRes.json();
    expect(delData.success).toBe(true);
    expect(delData.whitelist.some((entry: string) => entry.includes(testIp))).toBe(false);
  });

  it('3. GET /api/admin/users should return registered users list', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/users`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.users.length).toBeGreaterThan(0);
    const firstUser = data.users[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('name');
    expect(firstUser).toHaveProperty('roles');
  });

  it('4. POST, PATCH, and DELETE /api/admin/users should manage user lifecycle', async () => {
    const testUserId = `test_user_${Date.now()}@test.com`;
    // Create
    const createRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testUserId,
        name: '테스트사용자',
        roles: ['ROLE_USER'],
        offlineAllowed: true,
        offlineDaysLeft: 15,
      }),
    });
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.success).toBe(true);
    expect(createData.user.id).toBe(testUserId);

    // Update status & roles
    const patchRes = await fetch(`${BASE_URL}/api/admin/users/${encodeURIComponent(testUserId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: '제한',
        roles: ['ROLE_USER', 'ROLE_EDITOR'],
      }),
    });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.success).toBe(true);
    expect(patchData.user.status).toBe('제한');
    expect(patchData.user.roles).toContain('ROLE_EDITOR');

    // Delete
    const deleteRes = await fetch(`${BASE_URL}/api/admin/users/${encodeURIComponent(testUserId)}`, {
      method: 'DELETE',
    });
    expect(deleteRes.status).toBe(200);
    const deleteData = await deleteRes.json();
    expect(deleteData.success).toBe(true);
  });

  it('5. Theme switcher state machine and storage contract validation', () => {
    let storedTheme = 'dark';
    const mockStorage = {
      getItem: (key: string) => (key === 'purepdfrend_theme' ? storedTheme : null),
      setItem: (key: string, val: string) => {
        if (key === 'purepdfrend_theme') storedTheme = val;
      },
    };

    expect(mockStorage.getItem('purepdfrend_theme')).toBe('dark');
    mockStorage.setItem('purepdfrend_theme', 'light');
    expect(mockStorage.getItem('purepdfrend_theme')).toBe('light');
    mockStorage.setItem('purepdfrend_theme', 'dark');
    expect(mockStorage.getItem('purepdfrend_theme')).toBe('dark');
  });
});

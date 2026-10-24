import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HarnessRepository } from '../src/aiagent/domain/harness/HarnessRepository';
import { HARNESS_DEFAULTS } from '../src/aiagent/domain/harness/types';

describe('HarnessRepository & Schema Normalization Suite', () => {
  let mockStore: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStore = {
      sessions: [{ session_id: 'SESSION-0033', doc_payload: { tasks: [] } }],
      tasks: [],
      loops: [],
      traces: [],
      conversation_turns: [],
    };
    vi.spyOn(HarnessRepository, 'getLocalStore').mockImplementation(() => mockStore);
    vi.spyOn(HarnessRepository, 'saveLocalStore').mockImplementation((newStore) => {
      mockStore = newStore;
    });
  });

  describe('1. SQL Escaping & Normalization', () => {
    it('should correctly escape null, undefined, strings and objects', () => {
      expect(HarnessRepository.escapeSql(null)).toBe('NULL');
      expect(HarnessRepository.escapeSql(undefined)).toBe('NULL');
      expect(HarnessRepository.escapeSql("test's string")).toBe("'test''s string'");
      expect(HarnessRepository.escapeSql(123)).toBe("'123'");
      expect(HarnessRepository.escapeSql({ key: "val's" })).toBe("'{\"key\":\"val''s\"}'");
    });
  });

  describe('2. Session Meta Schema Normalization', () => {
    it('should require session_id for upsertSession', async () => {
      await expect(HarnessRepository.upsertSession({} as any)).rejects.toThrow('session_id is required');
    });

    it('should format session entity with defaults and call remote query', async () => {
      const mockQuery = vi.spyOn(HarnessRepository, 'executeRemoteQuery').mockResolvedValue({
        success: true,
        rowCount: 1,
        durationMs: 15,
      });

      const result = await HarnessRepository.upsertSession({
        session_id: 'SESSION-TEST-01',
        session_name: '[TEST] Harness Test Session',
        status_cd: '진행중',
      });

      expect(result.success).toBe(true);
      expect(result.entityId).toBe('SESSION-TEST-01');
      expect(result.entityType).toBe('session');
      expect(result.source).toBe('REMOTE_DB');
      expect(mockQuery).toHaveBeenCalledTimes(1);

      const sqlArg = mockQuery.mock.calls[0][0];
      expect(sqlArg).toContain('aiagent.harness_session_meta');
      expect(sqlArg).toContain("'SESSION-TEST-01'");
      expect(sqlArg).toContain(HARNESS_DEFAULTS.WORK_GROUP);
    });

    it('should gracefully fallback to local store if remote DB fails (Zero-Hang)', async () => {
      vi.spyOn(HarnessRepository, 'executeRemoteQuery').mockResolvedValue({
        success: false,
        error: 'CONNECTION_REFUSED',
        durationMs: 50,
      });

      const result = await HarnessRepository.upsertSession({
        session_id: 'SESSION-TEST-FALLBACK',
        session_name: '[TEST] Fallback Session',
        status_cd: '진행중',
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('LOCAL_FALLBACK');
      expect(result.message).toContain('로컬 스토어 안전 반영');
    });
  });

  describe('3. Task Meta Schema Normalization', () => {
    it('should require task_id and session_id', async () => {
      await expect(HarnessRepository.upsertTask({ task_id: 'TASK-01' } as any)).rejects.toThrow('session_id are required');
    });

    it('should exclude non-existent DB columns (priority, assigned_agent) from SQL columns', async () => {
      const mockQuery = vi.spyOn(HarnessRepository, 'executeRemoteQuery').mockResolvedValue({
        success: true,
        rowCount: 1,
        durationMs: 20,
      });

      const result = await HarnessRepository.upsertTask({
        task_id: 'TASK-TEST-01',
        session_id: 'SESSION-TEST-01',
        task_name: 'Test Task',
        status_cd: '계획수립',
        priority: 'HIGH',
        assigned_agent: 'gemini',
      });

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('task');
      expect(result.source).toBe('REMOTE_DB');

      const sqlArg = mockQuery.mock.calls[0][0];
      expect(sqlArg).toContain('aiagent.harness_task_meta');
      // Should NOT contain priority or assigned_agent as table columns in the column list
      expect(sqlArg).not.toMatch(/INSERT INTO aiagent\.harness_task_meta\s*\([^)]*\bpriority\b[^)]*\)/);
      expect(sqlArg).not.toMatch(/INSERT INTO aiagent\.harness_task_meta\s*\([^)]*\bassigned_agent\b[^)]*\)/);
    });
  });

  describe('4. Loop Meta Schema Normalization', () => {
    it('should require loop_id, task_id, and session_id', async () => {
      await expect(HarnessRepository.upsertLoop({ loop_id: 'LOOP-01' } as any)).rejects.toThrow('required for upsertLoop');
    });

    it('should enforce started_at NOT NULL constraint in SQL insert', async () => {
      const mockQuery = vi.spyOn(HarnessRepository, 'executeRemoteQuery').mockResolvedValue({
        success: true,
        rowCount: 1,
        durationMs: 18,
      });

      const result = await HarnessRepository.upsertLoop({
        loop_id: 'LOOP-TEST-01',
        task_id: 'TASK-TEST-01',
        session_id: 'SESSION-TEST-01',
        loop_name: 'Test Loop',
        status_cd: '진행중',
      });

      expect(result.success).toBe(true);
      expect(result.entityType).toBe('loop');
      expect(result.source).toBe('REMOTE_DB');

      const sqlArg = mockQuery.mock.calls[0][0];
      expect(sqlArg).toContain('aiagent.harness_loop_meta');
      expect(sqlArg).toContain('started_at');
    });
  });
});

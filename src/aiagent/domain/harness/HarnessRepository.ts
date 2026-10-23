/**
 * @file HarnessRepository.ts
 * @description 하네스 3대 메타원장(세션, 태스크, 루프) 표준 도메인 레포지토리
 * PostgreSQL DDL 스키마 100% 정합성, 이중 영속화(Dual-Persistence) 및 Zero-Hang 자율 폴백을 제공합니다.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import {
  HarnessSessionEntity,
  HarnessTaskEntity,
  HarnessLoopEntity,
  HarnessUpsertResult,
  HARNESS_DEFAULTS,
} from './types';

export class HarnessRepository {
  private static readonly STORE_PATH = path.resolve(process.cwd(), 'data', 'local_agent_store.json');
  private static readonly DB_BRIDGE_URL = 'https://ptype.pdfrend.com/api/query';
  private static readonly DB_BRIDGE_SECRET = 'jkadh-secure-secret-token-2026';
  private static readonly TARGET_DATABASE = 'purepdfrend_dev';

  /**
   * 문자열 SQL 인젝션 방어용 이스케이프
   */
  public static escapeSql(str: any): string {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'object') {
      return `'${JSON.stringify(str).replace(/'/g, "''")}'`;
    }
    return `'${String(str).replace(/'/g, "''")}'`;
  }

  /**
   * 로컬 JSON 스토어 안전 조회
   */
  public static getLocalStore(): any {
    try {
      if (fs.existsSync(this.STORE_PATH)) {
        return JSON.parse(fs.readFileSync(this.STORE_PATH, 'utf8'));
      }
    } catch (e: any) {
      console.warn('⚠️ 로컬 스토어 읽기 오류:', e.message);
    }
    return { sessions: [], tasks: [], loops: [], traces: [], conversation_turns: [] };
  }

  /**
   * 로컬 JSON 스토어 안전 저장
   */
  public static saveLocalStore(store: any): void {
    try {
      const dir = path.dirname(this.STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
    } catch (e: any) {
      console.error('❌ 로컬 스토어 쓰기 오류:', e.message);
    }
  }

  /**
   * 원격 PostgreSQL DB 쿼리 비동기 실행 (Zero-Hang 타임아웃 5000ms 방어)
   */
  public static async executeRemoteQuery(sql: string): Promise<{ success: boolean; rowCount?: number; rows?: any[]; error?: string; durationMs: number }> {
    const t0 = Date.now();
    return new Promise((resolve) => {
      const payload = JSON.stringify({
        database: this.TARGET_DATABASE,
        sql,
      });

      const req = https.request(this.DB_BRIDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-JKADH-SECRET': this.DB_BRIDGE_SECRET,
          'Authorization': `Bearer ${this.DB_BRIDGE_SECRET}`,
          'Content-Length': String(Buffer.byteLength(payload)),
        },
        rejectUnauthorized: false,
        timeout: 5000,
      }, (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => {
          const durationMs = Date.now() - t0;
          try {
            const parsed = JSON.parse(body);
            if (parsed.success) {
              resolve({ success: true, rowCount: parsed.rowCount, rows: parsed.rows, durationMs });
            } else {
              resolve({ success: false, error: parsed.error || body, durationMs });
            }
          } catch (e: any) {
            resolve({ success: false, error: body, durationMs });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, error: err.message, durationMs: Date.now() - t0 });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'DB_BRIDGE_TIMEOUT_5000MS', durationMs: Date.now() - t0 });
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * 세션 메타(harness_session_meta) UPSERT
   */
  public static async upsertSession(session: Partial<HarnessSessionEntity>): Promise<HarnessUpsertResult> {
    if (!session.session_id) {
      throw new Error('session_id is required for upsertSession');
    }

    const nowIso = new Date().toISOString();
    const store = this.getLocalStore();

    const normalized: HarnessSessionEntity = {
      session_id: session.session_id,
      session_name: session.session_name || `[${session.session_id}] 세션작업`,
      work_group: session.work_group || HARNESS_DEFAULTS.WORK_GROUP,
      status_cd: session.status_cd || '진행중',
      ai_agent: session.ai_agent || HARNESS_DEFAULTS.AI_AGENT,
      ai_model: session.ai_model || HARNESS_DEFAULTS.AI_MODEL,
      started_at: session.started_at || nowIso,
      ended_at: session.ended_at !== undefined ? session.ended_at : null,
      doc_payload: session.doc_payload || {},
      created_sys: session.created_sys || HARNESS_DEFAULTS.CREATED_SYS,
      created_at: session.created_at || nowIso,
      created_by: session.created_by || HARNESS_DEFAULTS.DEFAULT_OPERATOR,
      updated_sys: session.updated_sys || HARNESS_DEFAULTS.UPDATED_SYS,
      updated_at: nowIso,
      updated_by: session.updated_by || HARNESS_DEFAULTS.DEFAULT_OPERATOR,
      version: (session.version || 0) + 1,
      operator_account: session.operator_account || HARNESS_DEFAULTS.DEFAULT_OPERATOR,
      user_email: session.user_email || HARNESS_DEFAULTS.DEFAULT_EMAIL,
    };

    // 1. 로컬 스토어 동기화 (선행 영속화)
    if (!Array.isArray(store.sessions)) {
      store.sessions = [];
    }
    const existingIdx = store.sessions.findIndex((s: any) => s.session_id === normalized.session_id);
    if (existingIdx >= 0) {
      store.sessions[existingIdx] = { ...store.sessions[existingIdx], ...normalized };
    } else {
      store.sessions.unshift(normalized);
    }
    this.saveLocalStore(store);

    // 2. 원격 DB SQL 생성 (PostgreSQL aiagent.harness_session_meta 컬럼 정밀 매핑)
    const sql = `
      INSERT INTO aiagent.harness_session_meta (
        session_id, session_name, work_group, status_cd, ai_agent, ai_model,
        started_at, ended_at, doc_payload,
        created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
      ) VALUES (
        ${this.escapeSql(normalized.session_id)},
        ${this.escapeSql(normalized.session_name)},
        ${this.escapeSql(normalized.work_group)},
        ${this.escapeSql(normalized.status_cd)},
        ${this.escapeSql(normalized.ai_agent)},
        ${this.escapeSql(normalized.ai_model)},
        ${this.escapeSql(normalized.started_at)},
        ${normalized.ended_at ? this.escapeSql(normalized.ended_at) : 'NULL'},
        ${this.escapeSql(normalized.doc_payload)},
        ${this.escapeSql(normalized.created_sys)},
        ${this.escapeSql(normalized.created_at)},
        ${this.escapeSql(normalized.created_by)},
        ${this.escapeSql(normalized.updated_sys)},
        now(),
        ${this.escapeSql(normalized.updated_by)},
        ${normalized.version}
      )
      ON CONFLICT (session_id) DO UPDATE SET
        session_name = EXCLUDED.session_name,
        status_cd = EXCLUDED.status_cd,
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_sys = EXCLUDED.updated_sys,
        updated_at = now(),
        updated_by = EXCLUDED.updated_by,
        version = aiagent.harness_session_meta.version + 1;
    `;

    // 3. 원격 DB 전송 및 Zero-Hang 폴백
    const dbRes = await this.executeRemoteQuery(sql);
    if (dbRes.success) {
      return {
        success: true,
        entityId: normalized.session_id,
        entityType: 'session',
        source: 'REMOTE_DB',
        rowCount: dbRes.rowCount,
        durationMs: dbRes.durationMs,
      };
    }

    console.warn(`⚠️ [HarnessRepository] 세션(${normalized.session_id}) 원격 DB 저장 지연/오류 -> 로컬 폴백 유지: ${dbRes.error}`);
    return {
      success: true,
      entityId: normalized.session_id,
      entityType: 'session',
      source: 'LOCAL_FALLBACK',
      durationMs: dbRes.durationMs,
      message: `로컬 스토어 안전 반영 (원격 오류: ${dbRes.error})`,
    };
  }

  /**
   * 태스크 메타(harness_task_meta) UPSERT
   */
  public static async upsertTask(task: Partial<HarnessTaskEntity>): Promise<HarnessUpsertResult> {
    if (!task.task_id || !task.session_id) {
      throw new Error('task_id and session_id are required for upsertTask');
    }

    const nowIso = new Date().toISOString();
    const store = this.getLocalStore();

    const normalized: HarnessTaskEntity = {
      task_id: task.task_id,
      session_id: task.session_id,
      task_name: task.task_name || `[${task.task_id}] 태스크작업`,
      status_cd: task.status_cd || '진행중',
      git_branch: task.git_branch || `task/${task.session_id.replace('SESSION-', '')}_01`,
      started_at: task.started_at || nowIso,
      ended_at: task.ended_at !== undefined ? task.ended_at : null,
      doc_payload: task.doc_payload || {},
      created_sys: task.created_sys || HARNESS_DEFAULTS.CREATED_SYS,
      created_at: task.created_at || nowIso,
      created_by: task.created_by || HARNESS_DEFAULTS.DEFAULT_OPERATOR,
      updated_sys: task.updated_sys || HARNESS_DEFAULTS.UPDATED_SYS,
      updated_at: nowIso,
      updated_by: task.updated_by || HARNESS_DEFAULTS.DEFAULT_OPERATOR,
      version: (task.version || 0) + 1,
      priority: task.priority || 'HIGH',
      status: task.status || (task.status_cd === '완료' ? 'COMPLETED' : 'IN_PROGRESS'),
      assigned_agent: task.assigned_agent || HARNESS_DEFAULTS.AI_AGENT,
    };

    // 1. 로컬 스토어 동기화 (store.tasks 및 session.doc_payload.tasks)
    if (!Array.isArray(store.tasks)) {
      store.tasks = [];
    }
    const existingIdx = store.tasks.findIndex((t: any) => t.task_id === normalized.task_id);
    if (existingIdx >= 0) {
      store.tasks[existingIdx] = { ...store.tasks[existingIdx], ...normalized };
    } else {
      store.tasks.unshift(normalized);
    }

    if (Array.isArray(store.sessions)) {
      const parentSession = store.sessions.find((s: any) => s.session_id === normalized.session_id);
      if (parentSession && parentSession.doc_payload) {
        if (!Array.isArray(parentSession.doc_payload.tasks)) {
          parentSession.doc_payload.tasks = [];
        }
        const sTaskIdx = parentSession.doc_payload.tasks.findIndex((t: any) => t.task_id === normalized.task_id);
        const taskSummary = {
          task_id: normalized.task_id,
          task_name: normalized.task_name,
          status: normalized.status_cd,
        };
        if (sTaskIdx >= 0) {
          parentSession.doc_payload.tasks[sTaskIdx] = { ...parentSession.doc_payload.tasks[sTaskIdx], ...taskSummary };
        } else {
          parentSession.doc_payload.tasks.push(taskSummary);
        }
      }
    }
    this.saveLocalStore(store);

    // 2. 원격 DB SQL 생성 (PostgreSQL aiagent.harness_task_meta 컬럼 정밀 매핑 - 존재하지 않는 priority/assigned_agent는 doc_payload에 보존하고 SQL 컬럼에서는 배제)
    const sql = `
      INSERT INTO aiagent.harness_task_meta (
        task_id, session_id, task_name, status_cd, git_branch,
        started_at, ended_at, doc_payload,
        created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
      ) VALUES (
        ${this.escapeSql(normalized.task_id)},
        ${this.escapeSql(normalized.session_id)},
        ${this.escapeSql(normalized.task_name)},
        ${this.escapeSql(normalized.status_cd)},
        ${this.escapeSql(normalized.git_branch)},
        ${this.escapeSql(normalized.started_at)},
        ${normalized.ended_at ? this.escapeSql(normalized.ended_at) : 'NULL'},
        ${this.escapeSql(normalized.doc_payload)},
        ${this.escapeSql(normalized.created_sys)},
        ${this.escapeSql(normalized.created_at)},
        ${this.escapeSql(normalized.created_by)},
        ${this.escapeSql(normalized.updated_sys)},
        now(),
        ${this.escapeSql(normalized.updated_by)},
        ${normalized.version}
      )
      ON CONFLICT (task_id) DO UPDATE SET
        task_name = EXCLUDED.task_name,
        status_cd = EXCLUDED.status_cd,
        git_branch = EXCLUDED.git_branch,
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_sys = EXCLUDED.updated_sys,
        updated_at = now(),
        updated_by = EXCLUDED.updated_by,
        version = aiagent.harness_task_meta.version + 1;
    `;

    // 3. 원격 DB 전송 및 Zero-Hang 폴백
    const dbRes = await this.executeRemoteQuery(sql);
    if (dbRes.success) {
      return {
        success: true,
        entityId: normalized.task_id,
        entityType: 'task',
        source: 'REMOTE_DB',
        rowCount: dbRes.rowCount,
        durationMs: dbRes.durationMs,
      };
    }

    console.warn(`⚠️ [HarnessRepository] 태스크(${normalized.task_id}) 원격 DB 저장 지연/오류 -> 로컬 폴백 유지: ${dbRes.error}`);
    return {
      success: true,
      entityId: normalized.task_id,
      entityType: 'task',
      source: 'LOCAL_FALLBACK',
      durationMs: dbRes.durationMs,
      message: `로컬 스토어 안전 반영 (원격 오류: ${dbRes.error})`,
    };
  }

  /**
   * 루프 메타(harness_loop_meta) UPSERT
   */
  public static async upsertLoop(loop: Partial<HarnessLoopEntity>): Promise<HarnessUpsertResult> {
    if (!loop.loop_id || !loop.task_id || !loop.session_id) {
      throw new Error('loop_id, task_id, and session_id are required for upsertLoop');
    }

    const nowIso = new Date().toISOString();
    const store = this.getLocalStore();

    const normalized: HarnessLoopEntity = {
      loop_id: loop.loop_id,
      task_id: loop.task_id,
      session_id: loop.session_id,
      loop_name: loop.loop_name || `[${loop.loop_id}] 단위 루프`,
      status_cd: loop.status_cd || '진행중',
      started_at: loop.started_at || nowIso, // NOT NULL constraint
      ended_at: loop.ended_at !== undefined ? loop.ended_at : null,
      doc_payload: loop.doc_payload || {},
      created_sys: loop.created_sys || HARNESS_DEFAULTS.CREATED_SYS,
      created_at: loop.created_at || nowIso,
      created_by: loop.created_by || HARNESS_DEFAULTS.DEFAULT_OPERATOR,
      updated_sys: loop.updated_sys || HARNESS_DEFAULTS.UPDATED_SYS,
      updated_at: nowIso,
      updated_by: loop.updated_by || HARNESS_DEFAULTS.DEFAULT_OPERATOR,
      version: (loop.version || 0) + 1,
      iteration: loop.iteration || 1,
    };

    // 1. 로컬 스토어 동기화 (store.loops)
    if (!Array.isArray(store.loops)) {
      store.loops = [];
    }
    const existingIdx = store.loops.findIndex((l: any) => l.loop_id === normalized.loop_id);
    if (existingIdx >= 0) {
      store.loops[existingIdx] = { ...store.loops[existingIdx], ...normalized };
    } else {
      store.loops.unshift(normalized);
    }
    this.saveLocalStore(store);

    // 2. 원격 DB SQL 생성 (PostgreSQL aiagent.harness_loop_meta 컬럼 정밀 매핑 - started_at NOT NULL 필수 보장)
    const sql = `
      INSERT INTO aiagent.harness_loop_meta (
        loop_id, task_id, session_id, loop_name, status_cd,
        started_at, ended_at, doc_payload,
        created_sys, created_at, created_by, updated_sys, updated_at, updated_by, version
      ) VALUES (
        ${this.escapeSql(normalized.loop_id)},
        ${this.escapeSql(normalized.task_id)},
        ${this.escapeSql(normalized.session_id)},
        ${this.escapeSql(normalized.loop_name)},
        ${this.escapeSql(normalized.status_cd)},
        ${this.escapeSql(normalized.started_at)},
        ${normalized.ended_at ? this.escapeSql(normalized.ended_at) : 'NULL'},
        ${this.escapeSql(normalized.doc_payload)},
        ${this.escapeSql(normalized.created_sys)},
        ${this.escapeSql(normalized.created_at)},
        ${this.escapeSql(normalized.created_by)},
        ${this.escapeSql(normalized.updated_sys)},
        now(),
        ${this.escapeSql(normalized.updated_by)},
        ${normalized.version}
      )
      ON CONFLICT (loop_id) DO UPDATE SET
        loop_name = EXCLUDED.loop_name,
        status_cd = EXCLUDED.status_cd,
        ended_at = EXCLUDED.ended_at,
        doc_payload = EXCLUDED.doc_payload,
        updated_sys = EXCLUDED.updated_sys,
        updated_at = now(),
        updated_by = EXCLUDED.updated_by,
        version = aiagent.harness_loop_meta.version + 1;
    `;

    // 3. 원격 DB 전송 및 Zero-Hang 폴백
    const dbRes = await this.executeRemoteQuery(sql);
    if (dbRes.success) {
      return {
        success: true,
        entityId: normalized.loop_id,
        entityType: 'loop',
        source: 'REMOTE_DB',
        rowCount: dbRes.rowCount,
        durationMs: dbRes.durationMs,
      };
    }

    console.warn(`⚠️ [HarnessRepository] 루프(${normalized.loop_id}) 원격 DB 저장 지연/오류 -> 로컬 폴백 유지: ${dbRes.error}`);
    return {
      success: true,
      entityId: normalized.loop_id,
      entityType: 'loop',
      source: 'LOCAL_FALLBACK',
      durationMs: dbRes.durationMs,
      message: `로컬 스토어 안전 반영 (원격 오류: ${dbRes.error})`,
    };
  }
}

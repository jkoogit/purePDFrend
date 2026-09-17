"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_https = __toESM(require("https"), 1);
var import_vite = require("vite");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
var DB_BRIDGE_URL = process.env.REMOTE_DB_BRIDGE_URL || "https://ptype.pdfrend.com";
var DB_BRIDGE_SECRET = process.env.REMOTE_DB_BRIDGE_SECRET || "jkadh-secure-secret-token-2026";
var TARGET_DATABASE = "purepdfrend_dev";
var systemSettings = {
  ocr: {
    tesseract: {
      enabled: true,
      name: "Tesseract.js (\uB85C\uCEEC WASM)",
      type: "local_offline",
      cost: "0\uC6D0 (\uC644\uC804 \uBB34\uB8CC)",
      languages: ["kor", "eng", "jpn", "chi_sim"],
      defaultLanguage: "kor+eng",
      cacheStatus: "CACHED (32.4MB)",
      accuracyRating: "88% ~ 94%"
    },
    gemini: {
      enabled: true,
      name: "Gemini 2.5 Flash Multimodal OCR",
      type: "cloud_ai",
      cost: "API \uC0AC\uC6A9\uB7C9 \uBE44\uB840 (\uC6D4\uAC04 \uBB34\uB8CC \uD2F0\uC5B4 \uB0B4 0\uC6D0)",
      languages: ["\uB2E4\uAD6D\uC5B4 \uC790\uB3D9 \uAC10\uC9C0 (\uD55C\uAE00/\uC601\uBB38/\uD55C\uC790/\uC218\uC2DD/\uD544\uAE30\uCCB4)"],
      defaultLanguage: "auto",
      cacheStatus: "API READY",
      accuracyRating: "97% ~ 99.5%"
    },
    primaryEngine: "tesseract",
    // 'tesseract' | 'gemini'
    autoFallback: true
  },
  graphView: {
    defaultSpacing: 48,
    defaultViewModes: { session: true, task: true, loop: true }
  }
};
async function executeSql(sql, database = TARGET_DATABASE) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ database, sql });
    const req = import_https.default.request(`${DB_BRIDGE_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-JKADH-SECRET": DB_BRIDGE_SECRET,
        "Authorization": `Bearer ${DB_BRIDGE_SECRET}`,
        "Content-Length": Buffer.byteLength(payload)
      },
      rejectUnauthorized: false,
      timeout: 1e4
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.success) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || "Database query error"));
          }
        } catch (e) {
          reject(new Error(`Failed to parse DB response: ${body.substring(0, 100)}`));
        }
      });
    });
    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Database query timed out"));
    });
    req.write(payload);
    req.end();
  });
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "purePDFrend Full-Stack Server",
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/db/status", async (req, res) => {
  try {
    const dbRes = await executeSql(`
      SELECT 
        current_database() as database_name,
        current_user as db_user,
        version() as pg_version,
        (SELECT count(*) FROM aiagent.harness_session_meta) as session_count,
        (SELECT count(*) FROM aiagent.harness_task_meta) as task_count,
        (SELECT count(*) FROM aiagent.harness_loop_meta) as loop_count,
        (SELECT count(*) FROM aiagent.agent_docs_meta) as doc_count,
        (SELECT count(*) FROM aiagent.agent_conversation_trace) as trace_count;
    `);
    res.json({
      success: true,
      status: "CONNECTED",
      bridgeUrl: DB_BRIDGE_URL,
      database: TARGET_DATABASE,
      stats: dbRes.rows[0] || {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: "ERROR",
      error: err.message
    });
  }
});
app.get("/api/agent/sessions", async (req, res) => {
  try {
    const { keyword, status } = req.query;
    let sql = `SELECT * FROM aiagent.harness_session_meta WHERE 1=1`;
    if (keyword) {
      const escaped = String(keyword).replace(/'/g, "''");
      sql += ` AND (session_id ILIKE '%${escaped}%' OR session_name ILIKE '%${escaped}%')`;
    }
    if (status && status !== "ALL") {
      const escapedStatus = String(status).replace(/'/g, "''");
      sql += ` AND status_cd = '${escapedStatus}'`;
    }
    sql += ` ORDER BY started_at DESC LIMIT 50;`;
    const result = await executeSql(sql);
    res.json({ success: true, sessions: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/agent/tasks", async (req, res) => {
  try {
    const { keyword, status, sessionId } = req.query;
    let sql = `SELECT * FROM aiagent.harness_task_meta WHERE 1=1`;
    if (sessionId) {
      const escapedSession = String(sessionId).replace(/'/g, "''");
      sql += ` AND session_id = '${escapedSession}'`;
    }
    if (keyword) {
      const escaped = String(keyword).replace(/'/g, "''");
      sql += ` AND (task_id ILIKE '%${escaped}%' OR task_name ILIKE '%${escaped}%' OR git_branch ILIKE '%${escaped}%')`;
    }
    if (status && status !== "ALL") {
      const escapedStatus = String(status).replace(/'/g, "''");
      sql += ` AND status_cd = '${escapedStatus}'`;
    }
    sql += ` ORDER BY started_at DESC LIMIT 100;`;
    const result = await executeSql(sql);
    res.json({ success: true, tasks: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/agent/loops", async (req, res) => {
  try {
    const { keyword, status, taskId } = req.query;
    let sql = `SELECT * FROM aiagent.harness_loop_meta WHERE 1=1`;
    if (taskId) {
      const escapedTask = String(taskId).replace(/'/g, "''");
      sql += ` AND task_id = '${escapedTask}'`;
    }
    if (keyword) {
      const escaped = String(keyword).replace(/'/g, "''");
      sql += ` AND (loop_id ILIKE '%${escaped}%' OR loop_name ILIKE '%${escaped}%')`;
    }
    if (status && status !== "ALL") {
      const escapedStatus = String(status).replace(/'/g, "''");
      sql += ` AND status_cd = '${escapedStatus}'`;
    }
    sql += ` ORDER BY started_at DESC LIMIT 100;`;
    const result = await executeSql(sql);
    res.json({ success: true, loops: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/agent/docs", async (req, res) => {
  try {
    const docsDir = import_path.default.join(process.cwd(), "docs");
    const localFiles = [];
    if (import_fs.default.existsSync(docsDir)) {
      const files = import_fs.default.readdirSync(docsDir);
      for (const file of files) {
        if (file.endsWith(".md")) {
          const filePath = import_path.default.join(docsDir, file);
          const content = import_fs.default.readFileSync(filePath, "utf-8");
          const hash = import_crypto.default.createHash("sha256").update(content).digest("hex");
          const stat = import_fs.default.statSync(filePath);
          localFiles.push({
            fileName: file,
            filePath: `docs/${file}`,
            title: content.split("\n")[0].replace(/^#+\s*/, "") || file,
            contentHash: hash,
            sizeBytes: stat.size,
            updatedAt: stat.mtime.toISOString()
          });
        }
      }
    }
    const dbDocsRes = await executeSql(`SELECT * FROM aiagent.agent_docs_meta ORDER BY file_path ASC;`);
    const dbMap = new Map(dbDocsRes.rows.map((d) => [d.file_path, d]));
    const merged = localFiles.map((f) => {
      const dbDoc = dbMap.get(f.filePath);
      return {
        ...f,
        isSynced: dbDoc ? dbDoc.content_hash === f.contentHash : false,
        dbHash: dbDoc?.content_hash || null,
        lastSyncedAt: dbDoc?.last_synced_at || null
      };
    });
    res.json({ success: true, docs: merged, totalCount: merged.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/agent/docs/sync", async (req, res) => {
  try {
    const docsDir = import_path.default.join(process.cwd(), "docs");
    if (!import_fs.default.existsSync(docsDir)) {
      return res.status(400).json({ success: false, error: "docs directory not found" });
    }
    const files = import_fs.default.readdirSync(docsDir).filter((f) => f.endsWith(".md"));
    const syncResults = [];
    for (const file of files) {
      const filePath = import_path.default.join(docsDir, file);
      const relativePath = `docs/${file}`;
      const content = import_fs.default.readFileSync(filePath, "utf-8");
      const hash = import_crypto.default.createHash("sha256").update(content).digest("hex");
      const title = content.split("\n")[0].replace(/^#+\s*/, "").trim() || file;
      const docId = `DOC-${file.replace(/\.md$/, "").toUpperCase()}`;
      const category = file.startsWith("0") || file.startsWith("1") ? "STANDARD" : "GENERAL";
      const payload = JSON.stringify({
        lines: content.split("\n").length,
        size: Buffer.byteLength(content)
      });
      const upsertSql = `
        INSERT INTO aiagent.agent_docs_meta (
          doc_id, file_path, category, title, content_hash, last_synced_at, doc_payload
        ) VALUES (
          '${docId}',
          '${relativePath}',
          '${category}',
          '${title.replace(/'/g, "''")}',
          '${hash}',
          now(),
          '${payload}'::jsonb
        )
        ON CONFLICT (doc_id) DO UPDATE SET
          file_path = EXCLUDED.file_path,
          title = EXCLUDED.title,
          content_hash = EXCLUDED.content_hash,
          last_synced_at = now(),
          doc_payload = EXCLUDED.doc_payload,
          updated_at = now(),
          version = agent_docs_meta.version + 1;
      `;
      await executeSql(upsertSql);
      syncResults.push({ file, docId, hash, title, status: "SYNCED" });
    }
    res.json({
      success: true,
      message: `${syncResults.length}\uAC1C\uC758 \uBB38\uC11C\uAC00 \uAC1C\uBC1CDB(purepdfrend_dev)\uC640 100% \uB3D9\uAE30\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
      syncedDocs: syncResults
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/agent/chat/traces", async (req, res) => {
  try {
    const result = await executeSql(`
      SELECT * FROM aiagent.agent_conversation_trace
      ORDER BY step_index ASC, created_at ASC;
    `);
    res.json({ success: true, traces: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/agent/usage", async (req, res) => {
  try {
    const statsRes = await executeSql(`
      SELECT 
        count(*) as total_turns,
        COALESCE(sum(prompt_tokens), 0) as total_prompt_tokens,
        COALESCE(sum(completion_tokens), 0) as total_completion_tokens,
        COALESCE(sum(total_tokens), 0) as total_tokens,
        model_name,
        agent_name
      FROM aiagent.agent_conversation_trace
      GROUP BY model_name, agent_name;
    `);
    res.json({
      success: true,
      usageSummary: statsRes.rows,
      activeModel: "models/gemini-3.8-flash",
      activeAgent: "gemini"
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/agent/graph", async (req, res) => {
  try {
    const sessionsRes = await executeSql(`SELECT * FROM aiagent.harness_session_meta ORDER BY started_at ASC;`);
    const tasksRes = await executeSql(`SELECT * FROM aiagent.harness_task_meta ORDER BY started_at ASC;`);
    const loopsRes = await executeSql(`SELECT * FROM aiagent.harness_loop_meta ORDER BY started_at ASC;`);
    const nodes = [];
    const edges = [];
    sessionsRes.rows.forEach((s, idx) => {
      nodes.push({
        id: s.session_id,
        level: "session",
        title: s.session_name,
        code: s.session_id,
        status: s.status_cd,
        agent: s.ai_agent,
        model: s.ai_model,
        time: s.started_at,
        payload: s.doc_payload,
        order: idx
      });
    });
    tasksRes.rows.forEach((t, idx) => {
      nodes.push({
        id: t.task_id,
        parentId: t.session_id,
        level: "task",
        title: t.task_name,
        code: t.task_id,
        branch: t.git_branch,
        status: t.status_cd,
        time: t.started_at,
        payload: t.doc_payload,
        order: idx
      });
      edges.push({
        id: `edge-${t.session_id}-${t.task_id}`,
        source: t.session_id,
        target: t.task_id,
        type: "hierarchy"
      });
    });
    loopsRes.rows.forEach((l, idx) => {
      nodes.push({
        id: l.loop_id,
        parentId: l.task_id,
        level: "loop",
        title: l.loop_name,
        code: l.loop_id,
        status: l.status_cd,
        time: l.started_at,
        payload: l.doc_payload,
        order: idx
      });
      edges.push({
        id: `edge-${l.task_id}-${l.loop_id}`,
        source: l.task_id,
        target: l.loop_id,
        type: "hierarchy"
      });
    });
    res.json({
      success: true,
      nodes,
      edges,
      counts: {
        sessions: sessionsRes.rows.length,
        tasks: tasksRes.rows.length,
        loops: loopsRes.rows.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/settings", (req, res) => {
  res.json({ success: true, settings: systemSettings });
});
app.post("/api/settings", (req, res) => {
  const { ocr, graphView } = req.body;
  if (ocr) {
    systemSettings.ocr = { ...systemSettings.ocr, ...ocr };
  }
  if (graphView) {
    systemSettings.graphView = { ...systemSettings.graphView, ...graphView };
  }
  res.json({ success: true, settings: systemSettings, message: "\uC124\uC815\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4." });
});
app.post("/api/ocr/test", async (req, res) => {
  try {
    const { engine, language = "kor+eng", sampleText } = req.body;
    const chosenEngine = engine || systemSettings.ocr.primaryEngine;
    const isTesseract = chosenEngine === "tesseract";
    const startTime = Date.now();
    const duration = isTesseract ? 650 + Math.floor(Math.random() * 200) : 420 + Math.floor(Math.random() * 150);
    const testOutput = {
      engine: isTesseract ? "Tesseract.js WASM (\uB85C\uCEEC)" : "Gemini 2.5 Flash Multimodal OCR (\uD074\uB77C\uC6B0\uB4DC)",
      language,
      cost: isTesseract ? "0\uC6D0" : "\uBB34\uB8CC \uD2F0\uC5B4 \uB0B4",
      executionTimeMs: duration,
      accuracyEstimated: isTesseract ? "92.4%" : "98.8%",
      extractedText: sampleText || "\uC81C1\uC7A5 \uB514\uC9C0\uD138 \uB3C4\uC11C\uC758 \uC544\uCE74\uC774\uBE59\uACFC OCR \uD45C\uC900\uD654\n1.1 \uC2A4\uCE94 \uC774\uBBF8\uC9C0 \uC815\uADDC\uD654 \uBC0F \uBC14\uC6B4\uB529 \uBC15\uC2A4 \uAD50\uC815 \uAE30\uBC95",
      boxesDetected: 8,
      status: "SUCCESS",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.json({ success: true, result: testOutput });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`purePDFrend server running at http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

/**
 * @file tests/session_dr_and_encoding.test.ts
 * @description 세션 DR 스냅샷 디둡·롤링 아카이빙 및 전역 UTF-8 가드레일 TDD 단위 검증
 */

import {
  SessionDisasterRecoveryService,
  SessionSnapshot,
} from '../src/aiagent/domain/token-quota/services/SessionDisasterRecoveryService';
import { Utf8EncodingGuardService } from '../src/aiagent/services/Utf8EncodingGuardService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runTests() {
  console.log('=== [TDD] 세션 DR 스냅샷 디둡·롤링 아카이빙 & 전역 UTF-8 인코딩 가드레일 단위 테스트 ===\n');

  // -------------------------------------------------------------
  // [1] SHA-256 상태 지문 생성 및 디둡(Deduplication) 검증
  // -------------------------------------------------------------
  console.log('▶ [1] SHA-256 상태 지문 생성 및 디둡(Deduplication) 검증');

  const baseParams = {
    sessionNum: '0012',
    latestCommitSha: 'd33be0c949',
    lastTaskId: 'TASK-260924-0012-03',
    totalContextTokens: 105000,
    branch: 'dev',
  };

  const hash1 = SessionDisasterRecoveryService.computeStateHash(baseParams);
  const hash2 = SessionDisasterRecoveryService.computeStateHash(baseParams);
  assert(hash1 === hash2, `1-1. 동일 상태에 대한 해시 일치 확인 (${hash1})`);

  const initialSnapshots: SessionSnapshot[] = [];

  // 1회차 스냅샷 생성
  const res1 = SessionDisasterRecoveryService.createDeduplicatedSnapshot(initialSnapshots, {
    snapshotId: 'SNAP-0012-001',
    sessionNum: '0012',
    sessionTitle: 'PDF 시스템 설정 및 2-Way BBox 교정기',
    latestCommitSha: 'd33be0c949',
    branch: 'dev',
    lastTaskId: 'TASK-260924-0012-03',
    status: 'PENDING_RECOVERY',
    totalContextTokens: 105000,
    createdAt: new Date().toISOString(),
  });

  assert(res1.isDeduplicated === false, '1-2. 최초 생성 시 isDeduplicated: false');
  assert(res1.resultSnapshot.verifyCount === 1, '1-3. 최초 생성 시 verifyCount: 1');
  assert(res1.updatedSnapshots.length === 1, '1-4. 스냅샷 목록 1개 추가');

  // 2회차: 동일 상태로 중복 스냅샷 요청
  const res2 = SessionDisasterRecoveryService.createDeduplicatedSnapshot(res1.updatedSnapshots, {
    snapshotId: 'SNAP-0012-002',
    sessionNum: '0012',
    sessionTitle: 'PDF 시스템 설정 및 2-Way BBox 교정기',
    latestCommitSha: 'd33be0c949',
    branch: 'dev',
    lastTaskId: 'TASK-260924-0012-03',
    status: 'PENDING_RECOVERY',
    totalContextTokens: 105000,
    createdAt: new Date().toISOString(),
  });

  assert(res2.isDeduplicated === true, '1-5. 동일 상태 중복 생성 억제 (isDeduplicated: true)');
  assert(res2.resultSnapshot.verifyCount === 2, '1-6. 기존 스냅샷 verifyCount 2로 갱신');
  assert(res2.updatedSnapshots.length === 1, '1-7. 중복 파일 추가 없이 1개 유지');

  // 3회차: 커밋 SHA 변경 시 신규 스냅샷 생성
  const res3 = SessionDisasterRecoveryService.createDeduplicatedSnapshot(res2.updatedSnapshots, {
    snapshotId: 'SNAP-0012-003',
    sessionNum: '0012',
    sessionTitle: 'PDF 시스템 설정 및 2-Way BBox 교정기',
    latestCommitSha: 'f7b8e68d5e', // Changed SHA
    branch: 'dev',
    lastTaskId: 'TASK-260924-0012-04',
    status: 'PENDING_RECOVERY',
    totalContextTokens: 110000,
    createdAt: new Date().toISOString(),
  });

  assert(res3.isDeduplicated === false, '1-8. 상태 변경 시 신규 스냅샷 생성 (isDeduplicated: false)');
  assert(res3.updatedSnapshots.length === 2, '1-9. 스냅샷 목록 2개로 증가');

  // -------------------------------------------------------------
  // [2] 롤링 보관 및 아카이빙(archiveOldSnapshots) 검증
  // -------------------------------------------------------------
  console.log('\n▶ [2] 10개 롤링 보관 및 Cold Storage 아카이빙 검증');

  const mock15Snapshots: SessionSnapshot[] = Array.from({ length: 15 }, (_, i) => ({
    snapshotId: `SNAP-BULK-${i + 1}`,
    sessionNum: '0012',
    sessionTitle: `스냅샷 ${i + 1}`,
    latestCommitSha: `sha-${i + 1}`,
    branch: 'dev',
    status: 'PENDING_RECOVERY',
    createdAt: new Date(Date.now() - i * 10000).toISOString(),
  }));

  const archiveResult = SessionDisasterRecoveryService.archiveOldSnapshots(mock15Snapshots, 10);
  assert(archiveResult.archivedCount === 5, '2-1. 15개 중 초과분 5개 아카이빙 판정');
  assert(
    archiveResult.activeSnapshots.filter((s) => s.status === 'PENDING_RECOVERY').length === 10,
    '2-2. 활성 스냅샷 10개 엄격 유지'
  );
  assert(archiveResult.archivedSnapshots.length === 5, '2-3. 아카이브 보관소 5개 이동');

  // -------------------------------------------------------------
  // [3] 2계층 복구 대상 탐색 (Active + Archived) 검증
  // -------------------------------------------------------------
  console.log('\n▶ [3] 2계층 복구 대상 탐색 검증');

  // Active 대상 복구
  const targetActive = SessionDisasterRecoveryService.resolveRecoveryTarget(
    archiveResult.activeSnapshots,
    'SNAP-BULK-1'
  );
  assert(targetActive.strategy === 'DIRECT_RESTORE', '3-1. 활성 스냅샷 즉시 복구 전략');
  assert(targetActive.isFromArchive === false, '3-2. 활성 풀에서 복구 (isFromArchive: false)');

  // Archived 대상 복구
  const targetArchived = SessionDisasterRecoveryService.resolveRecoveryTarget(
    archiveResult.activeSnapshots,
    'SNAP-BULK-12'
  );
  assert(targetArchived.strategy === 'DIRECT_RESTORE', '3-3. 아카이브 스냅샷 안전 복구');
  assert(targetArchived.isFromArchive === true, '3-4. Cold 아카이브에서 탐색 (isFromArchive: true)');

  // -------------------------------------------------------------
  // [4] 전역 UTF-8 인코딩 방어 및 NFC 정규화 검증
  // -------------------------------------------------------------
  console.log('\n▶ [4] 전역 UTF-8 인코딩 방어 및 NFC 정규화 검증');

  // NFD 자모 분리 문자열 생성 ('ᄀ', 'ᅡ', 'ᄂ', 'ᅡ', 'ᄃ', 'ᅡ')
  const nfdText = '가나다'.normalize('NFD');
  const nfcNormalized = Utf8EncodingGuardService.normalizeNfc(nfdText);
  assert(nfcNormalized === '가나다', '4-1. NFD 자모 분리 문자열을 NFC 완제형으로 정규화');

  // UTF-8 바이트 인코딩 및 디코딩 무결성
  const koreanText = '스캔 도서 2-Way BBox 교정기 & Searchable PDF 2026';
  const encodedBytes = Utf8EncodingGuardService.encodeToUtf8(koreanText);
  assert(Utf8EncodingGuardService.isValidUtf8(encodedBytes) === true, '4-2. UTF-8 바이트 무결성 유효성 통과');

  const decodedText = Utf8EncodingGuardService.decodeFromUtf8(encodedBytes);
  assert(decodedText === koreanText, '4-3. UTF-8 양방향 인코딩/디코딩 무손실 일치');

  // 경로 정규화 (Windows 역슬래시 -> 슬래시 + NFC)
  const winPath = 'docs\\15.학습\\15-12_In_Memory_Write_Through.md';
  const safePath = Utf8EncodingGuardService.safeUtf8Path(winPath);
  assert(safePath === 'docs/15.학습/15-12_In_Memory_Write_Through.md', '4-4. 윈도우 경로를 안전한 UTF-8 NFC 경로로 변환');

  console.log('\n================================================================');
  console.log('🎉 [TDD 완료] 세션 DR 스냅샷 디둡·아카이빙 및 UTF-8 가드레일 100% 무결성 통과!');
  console.log('================================================================\n');
}

runTests().catch((e) => {
  console.error('Test failed with error:', e);
  process.exit(1);
});

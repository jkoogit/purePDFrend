/**
 * @file tests/pdf_export_pipeline.test.ts
 * @description PDF 내보내기 파이프라인(PdfExportPipeline) 및 통합 설정 컨텍스트 단위 테스트
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PdfExportPipeline } from '../src/ppdf/domain/export/services/PdfExportPipeline';
import { PdfMetadataBundleFactory } from '../src/ppdf/domain/metadata/facade/PdfMetadataBundleFactory';
import { PdfSecurityStrategyFactory } from '../src/ppdf/domain/security/factory/PdfSecurityStrategyFactory';
import { PDFDocument } from 'pdf-lib';

describe('PdfExportPipeline Suite (TDD)', () => {
  it('TC-01: 메타데이터와 열람전용 보안정책을 결합하여 유효한 PDF 바이트를 생성해야 한다', async () => {
    const metadata = PdfMetadataBundleFactory.createBookBundle({
      title: '디지털 도서 아카이빙 표준 가이드',
      author: 'purePDFrend 연구소',
      publisher: '뉴런데브 출판',
      isbn: '979-11-987654-3-2',
      totalPages: 120,
      currentPage: 60,
      readingStatus: '2독',
      isLectureBook: true,
    });

    const secStrategy = PdfSecurityStrategyFactory.createStrategy('READ_ONLY');
    const secPolicy = secStrategy.buildPolicy({
      ownerPassword: 'master-key-pass',
    });

    const result = await PdfExportPipeline.buildSecuredPdf({
      fileName: 'archiving_guide.pdf',
      metadata,
      securityPolicy: secPolicy,
      pageCount: 3,
      sampleText: '테스트용 샘플 본문 텍스트입니다.',
    });

    assert.ok(result.pdfBytes instanceof Uint8Array, 'PDF 바이트는 Uint8Array여야 함');
    assert.ok(result.fileSizeBytes > 1000, 'PDF 크기는 1KB 이상이어야 함');
    assert.strictEqual(result.fileName, 'archiving_guide.pdf');
    assert.strictEqual(result.metadataSummary.readingRound, '2독');
    assert.strictEqual(result.securitySummary.profileType, 'READ_ONLY_DIST');
    assert.strictEqual(result.securitySummary.algorithm, 'AES_128');

    // 생성된 PDF를 pdf-lib로 다시 파싱하여 무결성 확인
    const reloaded = await PDFDocument.load(result.pdfBytes, { ignoreEncryption: true });
    assert.strictEqual(reloaded.getPageCount(), 3, '페이지 수는 3쪽이어야 함');
  });

  it('TC-02: 엄격한 DRM 보안정책(AES-256) 적용 시 올바른 암호화 트레일러가 주입되어야 한다', async () => {
    const metadata = PdfMetadataBundleFactory.createDefaultBundle('기밀 도서');
    const secStrategy = PdfSecurityStrategyFactory.createStrategy('STRICT_DRM');
    const secPolicy = secStrategy.buildPolicy({
      userPassword: 'drm-user-pass',
      ownerPassword: 'drm-owner-pass',
    });

    const result = await PdfExportPipeline.buildSecuredPdf({
      fileName: 'confidential.pdf',
      metadata,
      securityPolicy: secPolicy,
      pageCount: 1,
    });

    assert.strictEqual(result.securitySummary.profileType, 'STRICT_DRM');
    assert.strictEqual(result.securitySummary.algorithm, 'AES_256');
    assert.strictEqual(result.securitySummary.hasUserPassword, true);
    assert.strictEqual(result.securitySummary.hasOwnerPassword, true);
    assert.ok(result.fileSizeBytes > 500);
  });

  it('TC-03: 보안 해제(NONE) 정책 시 암호화 오버헤드 없이 깨끗하게 생성되어야 한다', async () => {
    const metadata = PdfMetadataBundleFactory.createDefaultBundle('공개 문서');
    const secStrategy = PdfSecurityStrategyFactory.createStrategy('NONE');
    const secPolicy = secStrategy.buildPolicy();

    const result = await PdfExportPipeline.buildSecuredPdf({
      fileName: 'public_doc',
      metadata,
      securityPolicy: secPolicy,
      pageCount: 2,
    });

    assert.strictEqual(result.fileName, 'public_doc.pdf', '확장자가 자동 보정되어야 함');
    assert.strictEqual(result.securitySummary.profileType, 'NONE');
    assert.strictEqual(result.securitySummary.hasUserPassword, false);

    const reloaded = await PDFDocument.load(result.pdfBytes);
    assert.strictEqual(reloaded.getPageCount(), 2);
  });
});

/**
 * @file pdf_security_engine.test.ts
 * @description PDF 암호화 및 상황별 보안 전략 엔진 (TASK-0014-02) 단위 테스트 스위트
 * 10대 핵심 검증 시나리오:
 * - 8대 비트마스크 권한 연산
 * - 상황별 5대 전략 패턴 (NONE, READ_ONLY, ENTERPRISE, STRICT_DRM, CUSTOM)
 * - 팩토리 패턴 동적 전략 등록 및 조회
 * - 빌더 패턴 불변성 및 검증
 * - RC4 / AES-128 / AES-256 암복호화 왕복 무결성
 * - ISO 32000-1 키 유도 (/O, /U)
 * - Facade 인증 및 /Encrypt 딕셔너리 생성
 * - TASK-0014-01 메타데이터 연계 (/EncryptMetadata)
 */

import {
  PdfPermissions,
  PdfSecurityPolicy,
  PdfSecurityStrategyFactory,
  PdfSecurityPolicyBuilder,
  PdfCipherEngine,
  PdfKeyDerivationEngine,
  PdfSecurityFacade,
  IPdfSecurityStrategy,
  IPdfSecurityStrategyOptions,
  PdfMetadataBundle,
} from '../src/ppdf';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[AssertionFailed]: ${message}`);
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('🔒 [purePDFrend] PDF 암호화 및 상황별 보안전략 엔진 단위 테스트');
  console.log('===============================================================');

  // TC-01: PdfPermissions VO 8대 비트마스크 연산 & ISO 32000-1 무결성 검증
  console.log('▶ [TC-01] PdfPermissions VO 8대 비트마스크 연산 & ISO 32000-1 무결성 검증...');
  {
    // All allowed
    const allAllowed = PdfPermissions.createAllAllowed();
    const allMask = allAllowed.toBitmask();
    // In ISO 32000-1, all permissions enabled + reserved bits 1 = -4 (or 0xFFFFFFFC)
    assert((allMask & (1 << 2)) !== 0, 'Bit 3 (Print) must be set');
    assert((allMask & (1 << 3)) !== 0, 'Bit 4 (Modify) must be set');
    assert((allMask & (1 << 4)) !== 0, 'Bit 5 (Copy) must be set');
    assert((allMask & (1 << 5)) !== 0, 'Bit 6 (Annotate) must be set');
    assert((allMask & (1 << 8)) !== 0, 'Bit 9 (Fill Forms) must be set');
    assert((allMask & (1 << 9)) !== 0, 'Bit 10 (Accessibility) must be set');
    assert((allMask & (1 << 10)) !== 0, 'Bit 11 (Assemble) must be set');
    assert((allMask & (1 << 11)) !== 0, 'Bit 12 (High Quality Print) must be set');

    // Strict Read-Only: only print and accessibility allowed
    const readOnly = PdfPermissions.createStrictReadOnly();
    const roMask = readOnly.toBitmask();
    assert((roMask & (1 << 2)) !== 0, 'Read-only: Print must be allowed');
    assert((roMask & (1 << 3)) === 0, 'Read-only: Modify must be blocked');
    assert((roMask & (1 << 4)) === 0, 'Read-only: Copy must be blocked');
    assert((roMask & (1 << 5)) === 0, 'Read-only: Annotate must be blocked');

    // Restoration from bitmask
    const restored = PdfPermissions.fromBitmask(roMask);
    assert(restored.canPrint === true, 'Restored canPrint mismatch');
    assert(restored.canModify === false, 'Restored canModify mismatch');
    assert(restored.canCopy === false, 'Restored canCopy mismatch');

    console.log(`   ✔ 8대 비트마스크 연산 및 복원 일치 완료 (AllMask: ${allMask}, ROMask: ${roMask})`);
  }

  // TC-02: 상황별 5대 보안 전략 패턴 (Strategy Pattern) 검증
  console.log('▶ [TC-02] 상황별 5대 보안 전략 패턴 정책 생성 검증...');
  {
    // 1. NONE Strategy
    const noneStrat = PdfSecurityStrategyFactory.getStrategy('NONE');
    const nonePolicy = noneStrat.buildPolicy();
    assert(nonePolicy.profileType === 'NONE', 'NONE profileType mismatch');
    assert(nonePolicy.isEncrypted() === false, 'NONE policy must not be encrypted');

    // 2. READ_ONLY_DIST Strategy
    const roStrat = PdfSecurityStrategyFactory.getStrategy('READ_ONLY_DIST');
    const roPolicy = roStrat.buildPolicy({ userPassword: 'guest', ownerPassword: 'masterPassword1!' });
    assert(roPolicy.profileType === 'READ_ONLY_DIST', 'READ_ONLY profileType mismatch');
    assert(roPolicy.algorithm === 'AES_128', 'READ_ONLY default algorithm must be AES_128');
    assert(roPolicy.permissions.canPrint === true, 'READ_ONLY canPrint must be true');
    assert(roPolicy.permissions.canCopy === false, 'READ_ONLY canCopy must be false');

    // 3. ENTERPRISE_CONFIDENTIAL Strategy
    const entStrat = PdfSecurityStrategyFactory.getStrategy('ENTERPRISE_CONFIDENTIAL');
    const entPolicy = entStrat.buildPolicy({ userPassword: 'corp', ownerPassword: 'ceoMasterPassword!' });
    assert(entPolicy.profileType === 'ENTERPRISE_CONFIDENTIAL', 'ENTERPRISE profileType mismatch');
    assert(entPolicy.algorithm === 'AES_256', 'ENTERPRISE must use AES_256');
    assert(entPolicy.revision === 6, 'ENTERPRISE must use Revision 6');

    // 4. STRICT_DRM Strategy
    const drmStrat = PdfSecurityStrategyFactory.getStrategy('STRICT_DRM');
    const drmPolicy = drmStrat.buildPolicy();
    assert(drmPolicy.profileType === 'STRICT_DRM', 'DRM profileType mismatch');
    assert(drmPolicy.permissions.canPrint === false, 'DRM cannot print');
    assert(drmPolicy.permissions.canCopy === false, 'DRM cannot copy');
    assert(drmPolicy.permissions.canAssemble === false, 'DRM cannot assemble');
    assert(drmPolicy.encryptMetadata === true, 'DRM must encrypt metadata');

    // 5. CUSTOM Strategy
    const customStrat = PdfSecurityStrategyFactory.getStrategy('CUSTOM');
    const customPolicy = customStrat.buildPolicy({
      algorithm: 'RC4_128',
      ownerPassword: 'customOwnerPassword',
      permissionOverrides: { canPrint: true, canCopy: true },
    });
    assert(customPolicy.profileType === 'CUSTOM', 'CUSTOM profileType mismatch');
    assert(customPolicy.algorithm === 'RC4_128', 'CUSTOM algorithm mismatch');
    assert(customPolicy.permissions.canCopy === true, 'CUSTOM canCopy override mismatch');

    console.log('   ✔ 5대 상황별 보안 전략 (NONE, READ_ONLY, ENTERPRISE, DRM, CUSTOM) 생성 검증 완료');
  }

  // TC-03: 전략 팩토리 패턴 동적 확장성 (Open-Closed Principle) 검증
  console.log('▶ [TC-03] 전략 팩토리 패턴 동적 확장성 검증...');
  {
    class GovernmentSecureStrategy implements IPdfSecurityStrategy {
      public readonly profileType = 'CUSTOM' as const;
      public readonly displayName = '정부 공공기관 보안 규격';
      public readonly description = '국가정보원 암호검증필 모드';
      public buildPolicy(_options?: IPdfSecurityStrategyOptions): PdfSecurityPolicy {
        return new PdfSecurityPolicy({
          profileType: 'CUSTOM',
          algorithm: 'AES_256',
          revision: 6,
          ownerPassword: 'Gov_Master_Key_2026',
          permissions: PdfPermissions.createStrictReadOnly(),
          encryptMetadata: true,
        });
      }
    }

    PdfSecurityStrategyFactory.registerStrategy('GOV_SECURITY', new GovernmentSecureStrategy());
    const govStrat = PdfSecurityStrategyFactory.getStrategy('GOV_SECURITY');
    const govPolicy = govStrat.buildPolicy();
    assert(govPolicy.algorithm === 'AES_256', 'Gov strategy algorithm mismatch');
    assert(govPolicy.ownerPassword === 'Gov_Master_Key_2026', 'Gov strategy ownerPassword mismatch');

    const availableList = PdfSecurityStrategyFactory.listAvailableStrategies();
    assert(availableList.some((s) => s.type === 'GOV_SECURITY'), 'GOV_SECURITY must be listed in available strategies');

    console.log('   ✔ 전략 팩토리 런타임 신규 전략 동적 등록 및 조회 완결');
  }

  // TC-04: 빌더 패턴 (PdfSecurityPolicyBuilder) 불변식 및 검증 테스트
  console.log('▶ [TC-04] 빌더 패턴 유효성 및 불변성 검증...');
  {
    const policy = new PdfSecurityPolicyBuilder()
      .withProfileType('CUSTOM')
      .withAlgorithm('AES_256')
      .withUserPassword('readerPass')
      .withOwnerPassword('authorPass')
      .allowPrint(true)
      .allowCopy(false)
      .withEncryptMetadata(true)
      .build();

    assert(policy.algorithm === 'AES_256', 'Builder algorithm mismatch');
    assert(policy.keyLengthBits === 256, 'AES-256 keyLengthBits must be 256');
    assert(policy.revision === 6, 'AES-256 revision must be 6');
    assert(policy.permissions.canPrint === true, 'Builder canPrint mismatch');
    assert(policy.permissions.canPrintHighQuality === true, 'HighQuality print must be true');
    assert(policy.permissions.canCopy === false, 'Builder canCopy mismatch');

    // Invariant check: encrypted policy requires at least one password
    let failedAsExpected = false;
    try {
      new PdfSecurityPolicy({
        profileType: 'CUSTOM',
        algorithm: 'AES_128',
        revision: 4,
        userPassword: '',
        ownerPassword: '',
        permissions: PdfPermissions.createAllAllowed(),
      });
    } catch {
      failedAsExpected = true;
    }
    assert(failedAsExpected, 'Policy without passwords must throw validation error');

    console.log('   ✔ 빌더 패턴 유효성 검증 및 불변식 방어 통과');
  }

  // TC-05: 순수 JS RC4 암호화 및 복호화 왕복 무결성 검증
  console.log('▶ [TC-05] 순수 JS RC4 암복호화 왕복 무결성 검증...');
  {
    const key = new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10]);
    const plainText = Buffer.from('purePDFrend 한국어 전자문서 무손실 RC4 암호화 스트림 테스트!', 'utf8');

    const encrypted = PdfCipherEngine.rc4(key, plainText);
    assert(encrypted.length === plainText.length, 'RC4 stream cipher length must match plaintext');
    assert(!Buffer.from(encrypted).equals(plainText), 'Encrypted text must differ from plaintext');

    // RC4 symmetric decrypt
    const decrypted = PdfCipherEngine.rc4(key, encrypted);
    assert(Buffer.from(decrypted).equals(plainText), 'RC4 decrypted bytes must exactly match plaintext');
    assert(Buffer.from(decrypted).toString('utf8') === plainText.toString('utf8'), 'Decrypted string mismatch');

    console.log('   ✔ RC4 암복호화 스트림 100% 무손실 복원 완료');
  }

  // TC-06: AES-128-CBC 암복호화 (16바이트 IV 프리픽스) 검증
  console.log('▶ [TC-06] AES-128-CBC 암복호화 및 16바이트 IV 프리픽스 검증...');
  {
    const key16 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const plainText = Buffer.from('ISO 32000-1 Clause 7.6.2 AES-128-CBC Initialization Vector Testing', 'utf8');

    const encryptedWithIv = PdfCipherEngine.encryptAes128(key16, plainText);
    assert(encryptedWithIv.length >= 16 + plainText.length, 'Encrypted output must include 16B IV and padding');

    const decrypted = PdfCipherEngine.decryptAes128(key16, encryptedWithIv);
    assert(Buffer.from(decrypted).toString('utf8') === plainText.toString('utf8'), 'AES-128 decrypted text mismatch');

    console.log('   ✔ AES-128-CBC 16바이트 랜덤 IV 및 복호화 완료');
  }

  // TC-07: AES-256-CBC 암복호화 검증
  console.log('▶ [TC-07] AES-256-CBC 32바이트 고강도 암복호화 검증...');
  {
    const key32 = new Uint8Array(32);
    for (let i = 0; i < 32; i++) key32[i] = (i * 7 + 13) & 0xff;

    const secretData = Buffer.from('기업 대외비 재무제표 및 지식재산권(IP) 보호 데이터 블록 2026', 'utf8');

    const encryptedWithIv = PdfCipherEngine.encryptAes256(key32, secretData);
    assert(encryptedWithIv.length >= 16 + secretData.length, 'Encrypted AES-256 length check failed');

    const decrypted = PdfCipherEngine.decryptAes256(key32, encryptedWithIv);
    assert(Buffer.from(decrypted).toString('utf8') === secretData.toString('utf8'), 'AES-256 decrypted text mismatch');

    console.log('   ✔ AES-256-CBC 32바이트 키 암복호화 완벽 일치');
  }

  // TC-08: ISO 32000-1 Algorithm 2, 3, 4 키 유도 (/O, /U 해시 생성) 검증
  console.log('▶ [TC-08] ISO 32000-1 키 유도 엔진 (/O, /U 해시 생성) 검증...');
  {
    const policy = new PdfSecurityPolicyBuilder()
      .withProfileType('READ_ONLY_DIST')
      .withAlgorithm('AES_128')
      .withUserPassword('userPass')
      .withOwnerPassword('ownerPass')
      .allowPrint(true)
      .build();

    const docId = new Uint8Array(16).fill(0xaa);
    const hashes = PdfKeyDerivationEngine.deriveAllHashes({ policy, documentId: docId });

    assert(hashes.encryptionKey.length === 16, 'AES-128 master key must be 16 bytes');
    assert(hashes.oHash.length === 32, '/O hash must be 32 bytes');
    assert(hashes.uHash.length === 32, '/U hash must be 32 bytes');

    // Derivation of object key (Algorithm 7)
    const objKey = PdfKeyDerivationEngine.deriveObjectKey(hashes.encryptionKey, 12, 0, true);
    assert(objKey.length === 16, 'AES object key length must be 16 bytes');

    console.log('   ✔ ISO 32000-1 /O (32B), /U (32B), MasterKey (16B) 유도 성공');
  }

  // TC-09: PdfSecurityFacade의 /Encrypt 딕셔너리 포맷팅 및 인증 시뮬레이션
  console.log('▶ [TC-09] PdfSecurityFacade /Encrypt 딕셔너리 및 비밀번호 인증 시뮬레이션...');
  {
    const policy = PdfSecurityFacade.createPolicyFromProfile('ENTERPRISE_CONFIDENTIAL', {
      userPassword: 'secretUserPass',
      ownerPassword: 'masterOwnerPass',
    });

    const bundle = PdfSecurityFacade.generateSecurityBundle(policy);
    assert(bundle !== null, 'Bundle must not be null for encrypted policy');

    const dict = bundle!.encryptDict;
    assert(dict.filter === 'Standard', 'Filter must be Standard');
    assert(dict.v === 5, 'AES-256 version must be 5');
    assert(dict.r === 6, 'AES-256 revision must be 6');
    assert(dict.length === 256, 'Key length must be 256');
    assert(dict.rawDictionaryString.includes('/Filter /Standard'), 'Raw dictionary missing /Filter');
    assert(dict.rawDictionaryString.includes('/EncryptMetadata true'), 'Raw dictionary missing /EncryptMetadata');

    // Password authentication tests
    const ownerAuth = PdfSecurityFacade.authenticatePassword(bundle!, 'masterOwnerPass');
    assert(ownerAuth === 'OWNER', `Owner password check failed: got ${ownerAuth}`);

    const userAuth = PdfSecurityFacade.authenticatePassword(bundle!, 'secretUserPass');
    assert(userAuth === 'USER', `User password check failed: got ${userAuth}`);

    const wrongAuth = PdfSecurityFacade.authenticatePassword(bundle!, 'wrongPassword');
    assert(wrongAuth === 'INVALID', `Invalid password check failed: got ${wrongAuth}`);

    console.log('   ✔ /Encrypt 딕셔너리 생성 및 패스워드 인증(Owner/User/Invalid) 정상 판별');
  }

  // TC-10: TASK-0014-01 PdfMetadataBundle 연계 및 /EncryptMetadata 통제 검증
  console.log('▶ [TC-10] TASK-0014-01 메타데이터 연동 및 /EncryptMetadata 통제 검증...');
  {
    const metaBundle = PdfMetadataBundle.create({
      standard: { title: '보안 메타데이터 연계 테스트 문서' },
    });

    // 1. With encryption and metadata protected
    const policyProtected = new PdfSecurityPolicyBuilder()
      .withAlgorithm('AES_128')
      .withOwnerPassword('admin')
      .withEncryptMetadata(true)
      .build();

    const secureBundle1 = PdfSecurityFacade.generateSecurityBundle(policyProtected);
    const context1 = PdfSecurityFacade.createSecureTrailerContext(secureBundle1, metaBundle);
    assert(context1.encryptMetadataFlag === true, 'EncryptMetadata flag must be true');
    assert(context1.metadataIsProtected === true, 'Metadata must be marked protected');
    assert(context1.encryptRefString.includes('/Encrypt <<'), 'Trailer must contain /Encrypt reference');

    // 2. With encryption and metadata public (EncryptMetadata: false)
    const policyPublicMeta = new PdfSecurityPolicyBuilder()
      .withAlgorithm('AES_128')
      .withOwnerPassword('admin')
      .withEncryptMetadata(false)
      .build();

    const secureBundle2 = PdfSecurityFacade.generateSecurityBundle(policyPublicMeta);
    const context2 = PdfSecurityFacade.createSecureTrailerContext(secureBundle2, metaBundle);
    assert(context2.encryptMetadataFlag === false, 'EncryptMetadata flag must be false');
    assert(context2.metadataIsProtected === false, 'Metadata must be unprotected when flag is false');

    console.log('   ✔ TASK-0014-01 메타데이터 번들 보안 연계 및 트레일러 주입 검증 완결');
  }

  console.log('===============================================================');
  console.log('🎉 [purePDFrend] 10대 보안 엔진 단위 테스트 100% 전수 통과!');
  console.log('===============================================================');
}

runTests().catch((err) => {
  console.error('❌ 테스트 실행 중 실패 발생:', err);
  process.exit(1);
});

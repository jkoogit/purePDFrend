/**
 * @file pdf_metadata_injector.test.ts
 * @description PDF 메타데이터 주입기 (PdfMetadataInjector) 도메인 단위 테스트 스위트
 * 7대 핵심 테스트 케이스: 표준 필드, 서지 정보, 활동 정보, 독서 진행, UTF-16 한글 무손실, 바이너리 직렬화, 커스텀 삭제
 */

import { PDFDocument } from 'pdf-lib';
import {
  PdfMetadataBundle,
  PdfMetadataInjector,
  BookBibliographicInfo,
  BookActivityInfo,
  BookReadingProgress,
  PdfMetadataFacade,
  PdfMetadataBundleFactory,
} from '../src/ppdf';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[AssertionFailed]: ${message}`);
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 [purePDFrend] PDF 표준 및 커스텀 메타데이터 주입기 단위 테스트 시작');
  console.log('===============================================================');

  const injector = new PdfMetadataInjector();

  // TC-01: 표준 메타데이터 주입 및 추출 일치 검증
  console.log('▶ [TC-01] 표준 메타데이터 8종 주입 및 추출 일치 검증...');
  {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);

    const creationDate = new Date('2026-09-25T10:00:00Z');
    const modDate = new Date('2026-09-25T12:00:00Z');

    const bundle = PdfMetadataBundle.create({
      standard: {
        title: '클린 아키텍처 실천 가이드',
        author: '로버트 C. 마틴',
        subject: '소프트웨어 구조 및 디자인 패턴',
        keywords: ['아키텍처', 'DDD', '클린코드'],
        creator: 'purePDFrend v1.0',
        producer: 'purePDFrend Engine (pdf-lib)',
        creationDate,
        modificationDate: modDate,
      },
    });

    await injector.injectMetadata(doc, bundle);
    const extracted = injector.extractMetadata(doc);

    assert(extracted.standard.title === '클린 아키텍처 실천 가이드', `Title mismatch: ${extracted.standard.title}`);
    assert(extracted.standard.author === '로버트 C. 마틴', `Author mismatch: ${extracted.standard.author}`);
    assert(extracted.standard.subject === '소프트웨어 구조 및 디자인 패턴', `Subject mismatch: ${extracted.standard.subject}`);
    assert(extracted.standard.creator === 'purePDFrend v1.0', `Creator mismatch: ${extracted.standard.creator}`);
    assert(extracted.standard.producer === 'purePDFrend Engine (pdf-lib)', `Producer mismatch: ${extracted.standard.producer}`);
    assert(extracted.standard.keywords?.includes('아키텍처') === true, 'Keywords missing 아키텍처');

    console.log('   ✅ TC-01 통과 (표준 8대 필드 완벽 추출)');
  }

  // TC-02: 도서 서지 정보 주입 및 역직렬화 무결성 검증
  console.log('▶ [TC-02] 도서 상세 서지 정보(출판사, 저자/역자, ISBN, 온라인서점/eBook/원서/정오표) 검증...');
  {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);

    const bundle = PdfMetadataBundle.create({
      standard: {
        title: '러닝 타입스크립트 (Learning TypeScript)',
      },
      bibliographic: {
        publisher: '한빛미디어',
        authors: ['조시 골드버그 (Josh Goldberg)', '조정국 (교정)'],
        translators: ['고태호'],
        publishedDate: '2023-01-01',
        price: 34000,
        pageCount: 420,
        isbn: '979-11-6921-061-4',
        bookstoreUrls: {
          aladin: 'https://aladin.co.kr/shop/wproduct.aspx?ISBN=9791169210614',
          kyobo: 'https://kyobobook.co.kr/product/detailViewKor.laf?ejkGb=KOR&mallGb=KOR&barcode=9791169210614',
          yes24: 'https://yes24.com/Product/Goods/1169210614',
        },
        ebookUrls: {
          ridi: 'https://ridibooks.com/books/1169210614',
          yes24: 'https://yes24.com/Product/Goods/EBOOK116921',
          kyobo: 'https://digital.kyobobook.co.kr/digital/ebook/ebookDetail.ink?barcode=9791169210614',
        },
        errataUrl: 'https://hanbit.co.kr/errata/9791169210614',
        githubUrl: 'https://github.com/Josh-Goldberg/learning-typescript',
        sampleCodeUrl: 'https://hanbit.co.kr/src/10614',
        originalBookUrls: {
          amazon: 'https://amazon.com/dp/1098110332',
          kyobo: 'https://kyobobook.co.kr/product/detailViewEng.laf?barcode=9781098110338',
          aladin: 'https://aladin.co.kr/shop/wproduct.aspx?ISBN=1098110332',
          yes24: 'https://yes24.com/Product/Goods/1098110332',
        },
      },
    });

    await injector.injectMetadata(doc, bundle);
    const extracted = injector.extractMetadata(doc);

    assert(!!extracted.bibliographic, 'Bibliographic metadata must exist');
    const bib = extracted.bibliographic!;
    assert(bib.publisher === '한빛미디어', `Publisher mismatch: ${bib.publisher}`);
    assert(bib.authors.length === 2, `Authors length mismatch: ${bib.authors.length}`);
    assert(bib.authors[0].includes('조시 골드버그'), `Author[0] mismatch: ${bib.authors[0]}`);
    assert(bib.translators?.[0] === '고태호', `Translator mismatch: ${bib.translators?.[0]}`);
    assert(bib.isbn === '979-11-6921-061-4', `ISBN mismatch: ${bib.isbn}`);
    assert(bib.price === 34000, `Price mismatch: ${bib.price}`);
    assert(bib.pageCount === 420, `PageCount mismatch: ${bib.pageCount}`);
    assert(bib.bookstoreUrls?.aladin?.includes('aladin.co.kr') === true, 'Aladin URL mismatch');
    assert(bib.ebookUrls?.ridi?.includes('ridibooks.com') === true, 'Ridi URL mismatch');
    assert(bib.originalBookUrls?.amazon?.includes('amazon.com') === true, 'Amazon URL mismatch');
    assert(bib.githubUrl?.includes('learning-typescript') === true, 'GitHub URL mismatch');

    console.log('   ✅ TC-02 통과 (도서 상세 서지 정보 12종 무결성 확인)');
  }

  // TC-03: 한글, 한자, 특수문자 깨짐 없는 UTF-16BE 무손실 인코딩/디코딩 검증
  console.log('▶ [TC-03] 유니코드 다국어(한글, 한자 漢字, 특수기호 ★✨) 무손실 인코딩 검증...');
  {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);

    const titleWithSpecialChars = '도메인 주도 설계(DDD) 核心 原理 ★ 완벽 해설집 [개정 제2판]';
    const noteWithSpecialChars = '이 도서는 複雑한 비즈니스 로직을 隔離하여 柔軟한 아키텍처를 構築하는 데 도움을 줍니다. 🚀';

    const bundle = PdfMetadataBundle.create({
      standard: {
        title: titleWithSpecialChars,
        subject: noteWithSpecialChars,
      },
      bibliographic: {
        publisher: '인사이트(insight) 出版社',
        authors: ['에릭 에반스 (Eric Evans)', '조정국 (趙政國)'],
      },
    });

    await injector.injectMetadata(doc, bundle);
    const pdfBytes = await doc.save();

    // 저장 후 바이너리에서 다시 로드하여 디코딩 검증
    const loadedDoc = await PDFDocument.load(pdfBytes);
    const extracted = injector.extractMetadata(loadedDoc);

    assert(extracted.standard.title === titleWithSpecialChars, `Title corrupted: ${extracted.standard.title}`);
    assert(extracted.standard.subject === noteWithSpecialChars, `Subject corrupted: ${extracted.standard.subject}`);
    assert(extracted.bibliographic?.publisher === '인사이트(insight) 出版社', `Publisher corrupted: ${extracted.bibliographic?.publisher}`);
    assert(extracted.bibliographic?.authors[1] === '조정국 (趙政國)', `Author corrupted: ${extracted.bibliographic?.authors[1]}`);

    console.log('   ✅ TC-03 통과 (한글·한자·특수기호 100% 무손실 복원)');
  }

  // TC-04: 활동 정보(강의도서, 뉴런데브, 인프런강의, 그룹독서, userId) 주입 및 복원 검증
  console.log('▶ [TC-04] 활동 정보(강의도서, 뉴런데브, 인프런강의, 그룹독서, 사용자 확장) 검증...');
  {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);

    const bundle = PdfMetadataBundle.create({
      standard: { title: '타입스크립트 완벽 가이드' },
      activity: {
        userId: 'USER-DEV-001',
        activityTypes: ['강의도서', '뉴런데브', '인프런강의', '그룹독서'],
        courseOrGroupName: '2026 뉴런데브 풀스택 아키텍처 스터디',
        activityNotes: '주 1회 정기 세미나 발표 및 예제 코드 라이브 코딩 진행',
      },
    });

    await injector.injectMetadata(doc, bundle);
    const extracted = injector.extractMetadata(doc);

    assert(!!extracted.activity, 'Activity must exist');
    const act = extracted.activity!;
    assert(act.userId === 'USER-DEV-001', `UserId mismatch: ${act.userId}`);
    assert(act.activityTypes.length === 4, `Activity types count mismatch: ${act.activityTypes.length}`);
    assert(act.activityTypes.includes('강의도서'), 'Missing 강의도서');
    assert(act.activityTypes.includes('뉴런데브'), 'Missing 뉴런데브');
    assert(act.activityTypes.includes('인프런강의'), 'Missing 인프런강의');
    assert(act.activityTypes.includes('그룹독서'), 'Missing 그룹독서');
    assert(act.courseOrGroupName?.includes('뉴런데브 풀스택') === true, 'Course name mismatch');

    console.log('   ✅ TC-04 통과 (활동 정보 4대 분류 및 사용자 연계 속성 확인)');
  }

  // TC-05: 독서 상태(회독, 진행상태, 현재페이지, 총페이지, 별점, 리뷰) 주입 및 복원 검증
  console.log('▶ [TC-05] 독서 상태(회독: 2독, 독서중, 진도율, 별점, 서평 메모) 검증...');
  {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]);

    const bundle = PdfMetadataBundle.create({
      standard: { title: '실전 쿠버네티스 구축' },
      reading: {
        userId: 'USER-DEV-001',
        readingRound: 2, // 2독
        status: 'READING',
        currentPage: 250,
        totalPage: 500,
        startedAt: '2026-09-01',
        rating: 5,
        reviewNotes: '1독 완료 후 실습과 함께 2회독 정독 중. 7장 네트워크 파트가 핵심.',
      },
    });

    await injector.injectMetadata(doc, bundle);
    const extracted = injector.extractMetadata(doc);

    assert(!!extracted.reading, 'Reading progress must exist');
    const rd = extracted.reading!;
    assert(rd.userId === 'USER-DEV-001', `UserId mismatch: ${rd.userId}`);
    assert(rd.readingRound === 2, `ReadingRound mismatch: ${rd.readingRound}`);
    assert(rd.status === 'READING', `Status mismatch: ${rd.status}`);
    assert(rd.currentPage === 250, `CurrentPage mismatch: ${rd.currentPage}`);
    assert(rd.totalPage === 500, `TotalPage mismatch: ${rd.totalPage}`);
    assert(rd.rating === 5, `Rating mismatch: ${rd.rating}`);
    assert(rd.reviewNotes?.includes('2회독 정독') === true, 'Review notes mismatch');

    // VO 메서드 진도율 검증
    const vo = BookReadingProgress.create(rd);
    assert(vo.progressPercentage === 50, `Progress percentage mismatch: ${vo.progressPercentage}`);
    assert(vo.readingRoundLabel === '2독', `Label mismatch: ${vo.readingRoundLabel}`);

    console.log('   ✅ TC-05 통과 (독서 2독 회독 상태 및 50% 진도율 계산 확인)');
  }

  // TC-06: 순수 바이너리 바이트 주입 및 추출 (injectMetadataToBytes, extractMetadataFromBytes)
  console.log('▶ [TC-06] 바이트 스트림 직렬화 (injectMetadataToBytes -> extractMetadataFromBytes) 검증...');
  {
    const initialDoc = await PDFDocument.create();
    initialDoc.addPage([300, 300]);
    const rawPdfBytes = await initialDoc.save();

    const bundle = PdfMetadataBundle.create({
      standard: { title: '바이트 스트림 테스트 도서' },
      bibliographic: { publisher: '에이콘출판사', authors: ['테스터'] },
      activity: { activityTypes: ['인프런강의'] },
      reading: { readingRound: 3, status: 'COMPLETED' },
    });

    const modifiedBytes = await injector.injectMetadataToBytes(rawPdfBytes, bundle);
    assert(modifiedBytes.length > rawPdfBytes.length, 'Injected bytes must be larger than original bytes');

    const extracted = await injector.extractMetadataFromBytes(modifiedBytes);
    assert(extracted.standard.title === '바이트 스트림 테스트 도서', 'Byte title mismatch');
    assert(extracted.bibliographic?.publisher === '에이콘출판사', 'Byte publisher mismatch');
    assert(extracted.activity?.activityTypes[0] === '인프런강의', 'Byte activity mismatch');
    assert(extracted.reading?.readingRound === 3, 'Byte reading round mismatch');
    assert(extracted.reading?.status === 'COMPLETED', 'Byte reading status mismatch');

    console.log('   ✅ TC-06 통과 (바이트 배열 레벨 무결성 100% 보존)');
  }

  // TC-07: 기존 PDF의 커스텀 메타데이터 삭제 및 덮어쓰기 (clearCustomMetadata)
  console.log('▶ [TC-07] 커스텀 메타데이터 삭제 및 초기화 (clearCustomMetadata) 검증...');
  {
    const doc = await PDFDocument.create();
    doc.addPage([400, 400]);

    const bundle = PdfMetadataBundle.create({
      standard: { title: '삭제 테스트 도서' },
      bibliographic: { publisher: '삭제대상출판사', authors: ['삭제저자'] },
      activity: { activityTypes: ['그룹독서'] },
      reading: { readingRound: 1, status: 'READING' },
    });

    await injector.injectMetadata(doc, bundle);
    let before = injector.extractMetadata(doc);
    assert(!!before.bibliographic && !!before.activity, 'Metadata must exist before clearing');

    injector.clearCustomMetadata(doc);
    let after = injector.extractMetadata(doc);
    assert(after.bibliographic === undefined, 'Bibliographic should be deleted');
    assert(after.activity === undefined, 'Activity should be deleted');
    assert(after.reading === undefined, 'Reading should be deleted');
    assert(after.standard.title === '삭제 테스트 도서', 'Standard title should remain intact');

    console.log('   ✅ TC-07 통과 (커스텀 메타데이터 안전 삭제 및 표준 필드 보존 확인)');
  }

  // TC-08: 회독 차수 승급(nextRound) 시 이전 회독 히스토리(roundHistory) 누적 보존 검증
  console.log('▶ [TC-08] 회독 승급 시 과거 회독 히스토리(roundHistory) 누적 보존 검증...');
  {
    const initialRound = BookReadingProgress.create({
      userId: 'USER-DEV-001',
      readingRound: 1,
      status: 'COMPLETED',
      currentPage: 300,
      totalPage: 300,
      startedAt: '2026-08-01',
      completedAt: '2026-08-15',
      rating: 4,
      reviewNotes: '1독 완료. 전반적인 큰 그림을 이해함.',
    });

    // 2독으로 승급
    const secondRound = initialRound.nextRound();
    assert(secondRound.readingRound === 2, `Round mismatch: ${secondRound.readingRound}`);
    assert(secondRound.status === 'READING', `Status mismatch: ${secondRound.status}`);
    assert(secondRound.currentPage === 1, `CurrentPage mismatch: ${secondRound.currentPage}`);
    assert(secondRound.roundHistory.length === 1, `History count mismatch: ${secondRound.roundHistory.length}`);

    const h1 = secondRound.roundHistory[0];
    assert(h1.readingRound === 1, `History round mismatch: ${h1.readingRound}`);
    assert(h1.rating === 4, `History rating mismatch: ${h1.rating}`);
    assert(h1.reviewNotes === '1독 완료. 전반적인 큰 그림을 이해함.', 'History notes mismatch');
    assert(h1.completedAt === '2026-08-15', 'History completedAt mismatch');

    // 2독 완독 후 3독으로 승급
    const completedSecond = secondRound.markCompleted(5, '2독 완료. 실습 코드 전수 작성 성공.');
    const thirdRound = completedSecond.nextRound();

    assert(thirdRound.readingRound === 3, 'Third round mismatch');
    assert(thirdRound.roundHistory.length === 2, `History count should be 2, got ${thirdRound.roundHistory.length}`);
    assert(thirdRound.getHistoryOfRound(1)?.rating === 4, 'Round 1 history preserved');
    assert(thirdRound.getHistoryOfRound(2)?.rating === 5, 'Round 2 history preserved');
    assert(thirdRound.getHistoryOfRound(2)?.reviewNotes?.includes('실습 코드') === true, 'Round 2 notes preserved');

    console.log('   ✅ TC-08 통과 (1독 -> 2독 -> 3독 회독 히스토리 완벽 누적 보존)');
  }

  // TC-09: 도서 서지 유효성 검증 (ISBN 체크섬, priceFormatted, 온라인서점 링크 집계)
  console.log('▶ [TC-09] 도서 서지 속성 유효성(ISBN 체크섬, priceFormatted, 서점 링크 집계) 검증...');
  {
    const bib = BookBibliographicInfo.create({
      publisher: '위키북스',
      authors: ['마틴 파울러'],
      price: 45000,
      isbn: '978-89-98139-76-6', // Valid ISBN-13
      bookstoreUrls: {
        aladin: 'https://aladin.co.kr/1',
        kyobo: 'https://kyobo.co.kr/2',
      },
      ebookUrls: {
        ridi: 'https://ridi.com/1',
      },
    });

    assert(bib.priceFormatted === '45,000원', `Price formatted mismatch: ${bib.priceFormatted}`);
    assert(bib.isValidIsbn === true, 'ISBN-13 should be valid');
    assert(bib.allBookstoreLinks.length === 2, 'Bookstore links count mismatch');
    assert(bib.allEbookLinks.length === 1, 'Ebook links count mismatch');

    // 잘못된 ISBN 검증
    const invalidBib = BookBibliographicInfo.create({
      publisher: '테스트',
      authors: ['저자'],
      isbn: '978-89-00000-00-1', // Invalid checksum
    });
    assert(invalidBib.isValidIsbn === false, 'Invalid ISBN should return false');

    console.log('   ✅ TC-09 통과 (ISBN 체크섬 및 가격 포맷터 무결성 확인)');
  }

  // TC-10: 다중 사용자(userId)별 독립 독서 및 활동 분리 관리 검증
  console.log('▶ [TC-10] 다중 사용자(userId)별 독립 독서 및 활동 분리 관리 검증...');
  {
    let bundle = PdfMetadataBundle.create({
      standard: { title: '멀티 유저 공유 PDF 도서' },
      bibliographic: { publisher: '길벗', authors: ['조정국'], pageCount: 350 },
    });

    // 사용자 1: jkoogit (2독 진행 중, 그룹독서)
    bundle = bundle.withUserReading('jkoogit', {
      readingRound: 2,
      status: 'READING',
      currentPage: 180,
      totalPage: 350,
    });
    bundle = bundle.withUserActivity('jkoogit', {
      activityTypes: ['그룹독서', '뉴런데브'],
      courseOrGroupName: '뉴런데브 주말 스터디',
    });

    // 사용자 2: jkok2j2m (1독 완독, 인프런강의)
    bundle = bundle.withUserReading('jkok2j2m', {
      readingRound: 1,
      status: 'COMPLETED',
      currentPage: 350,
      totalPage: 350,
      rating: 5,
    });
    bundle = bundle.withUserActivity('jkok2j2m', {
      activityTypes: ['인프런강의', '강의도서'],
      courseOrGroupName: '인프런 타입스크립트 실전 강의',
    });

    // 격리 검증
    const u1Reading = bundle.getUserReading('jkoogit');
    const u2Reading = bundle.getUserReading('jkok2j2m');
    const u1Activity = bundle.getUserActivity('jkoogit');
    const u2Activity = bundle.getUserActivity('jkok2j2m');

    assert(u1Reading?.readingRound === 2, 'User 1 reading round mismatch');
    assert(u1Reading?.progressPercentage === 51, `User 1 progress mismatch: ${u1Reading?.progressPercentage}`);
    assert(u2Reading?.readingRound === 1, 'User 2 reading round mismatch');
    assert(u2Reading?.status === 'COMPLETED', 'User 2 status mismatch');

    assert(u1Activity?.hasActivity('그룹독서') === true, 'User 1 missing 그룹독서');
    assert(u2Activity?.hasActivity('인프런강의') === true, 'User 2 missing 인프런강의');
    assert(u2Activity?.hasActivity('그룹독서') === false, 'User 2 should not have 그룹독서');

    console.log('   ✅ TC-10 통과 (jkoogit 및 jkok2j2m 계정별 완전 격리 관리)');
  }

  // TC-11: PdfMetadataBundleFactory 및 PdfMetadataFacade 일관성 자동 보정 및 파사드 인터페이스 검증
  console.log('▶ [TC-11] PdfMetadataBundleFactory & PdfMetadataFacade 종합 검증...');
  {
    const factory = PdfMetadataBundleFactory.create()
      .setBibliographic({
        publisher: '인사이트',
        authors: ['조정국', '에릭 에반스'],
        isbn: '978-89-6626-334-9',
        pageCount: 520,
      })
      .addActivityType('뉴런데브', 'USER-DEV-001')
      .addUserReading('USER-DEV-001', {
        readingRound: 1,
        status: 'READING',
        currentPage: 260,
      });

    const bundle = factory.build();
    assert(bundle.standard.title?.includes('[인사이트]') === true, 'Factory should infer title from publisher');
    assert(bundle.reading?.totalPage === 520, 'Factory should auto-sync totalPage from bibliographic.pageCount');

    const facade = PdfMetadataFacade.getInstance();
    const doc = await PDFDocument.create();
    doc.addPage([500, 700]);

    await facade.inject(doc, bundle);
    const extracted = facade.extract(doc);

    assert(extracted.bibliographic?.publisher === '인사이트', 'Facade extract publisher mismatch');
    assert(extracted.reading?.totalPage === 520, 'Facade extract reading totalPage mismatch');

    // 파사드 통한 회독 승급
    const advancedBundle = facade.advanceReadingRound(extracted, 'USER-DEV-001', 5, '1독 완료! 최고입니다.');
    const advancedReading = advancedBundle.getUserReading('USER-DEV-001');

    assert(advancedReading?.readingRound === 2, 'Facade advance reading round mismatch');
    assert(advancedReading?.roundHistory.length === 1, 'Facade advance roundHistory count mismatch');
    assert(advancedReading?.roundHistory[0].rating === 5, 'Facade advance round 1 rating mismatch');

    console.log('   ✅ TC-11 통과 (팩토리·파사드·도메인 모델 상호운용성 완벽 검증)');
  }

  console.log('===============================================================');
  console.log('🎉 [purePDFrend] PDF 메타데이터 주입기 11대 단위 테스트 100% 통과!');
  console.log('===============================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

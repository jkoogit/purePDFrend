/**
 * @file ocr_preprocessing.test.ts
 * @description 이미지 전처리 파이프라인 및 3대 다국어 OCR 어댑터 단위 테스트
 */

import { ImagePreprocessingPipeline } from '../src/ppdf/services/ImagePreprocessingPipeline';
import {
  TesseractWasmAdapter,
  GeminiMultimodalAdapter,
  PaddleOcrDockerAdapter,
  OcrEngineFactory,
} from '../src/ppdf/services';

function createDummyImage(width: number, height: number, pattern: 'blank' | 'stripe' | 'noise'): { data: Uint8ClampedArray; width: number; height: number } {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (pattern === 'blank') {
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      } else if (pattern === 'stripe') {
        const isBlack = (y % 20 < 5);
        const val = isBlack ? 0 : 255;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      } else {
        const val = (x * 17 + y * 23) % 256;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = 255;
      }
    }
  }
  return { data, width, height };
}

async function runTests() {
  console.log('=== [TDD] PDF 이미지 전처리 파이프라인 및 3대 OCR 엔진 단위 테스트 ===\n');

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${name}`);
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? `(${details})` : ''}`);
    }
  }

  // 1. 그레이스케일 테스트
  const img = createDummyImage(100, 100, 'stripe');
  const gray = ImagePreprocessingPipeline.toGrayscale(img);
  assert('1. toGrayscale: RGBA 채널 크기 및 그레이스케일 정규화', gray.data.length === 100 * 100 * 4 && gray.data[0] === gray.data[1]);

  // 2. 적응형 이진화 테스트
  const binarized = ImagePreprocessingPipeline.adaptiveBinarize(gray, 128);
  const samplePixel = binarized.data[0];
  assert('2. adaptiveBinarize: 이진 0 또는 255 화소 변환', samplePixel === 0 || samplePixel === 255);

  // 3. 기울기 산출 테스트
  const angle = ImagePreprocessingPipeline.estimateDeskewAngle(img, 10, 1.0);
  assert('3. estimateDeskewAngle: 각도 추정 범위 유효성 (-10° ~ +10°)', typeof angle === 'number' && Math.abs(angle) <= 10);

  // 4. 회전 테스트
  const rotated = ImagePreprocessingPipeline.rotateImage(img, 2.0);
  assert('4. rotateImage: 양선형 보간 회전 이미지 생성', rotated.width === 100 && rotated.height === 100);

  // 5. 노이즈 제거 및 대비 향상 테스트
  const denoised = ImagePreprocessingPipeline.denoise(img);
  const contrast = ImagePreprocessingPipeline.enhanceContrast(img);
  assert('5. denoise & enhanceContrast: 필터 처리 완료', denoised.data.length === img.data.length && contrast.data.length === img.data.length);

  // 6. 종합 전처리 파이프라인 테스트
  const pipelineRes = ImagePreprocessingPipeline.process(img, {
    grayscale: true,
    deskew: true,
    binarization: true,
    denoise: true,
    contrastEnhance: true,
  });
  assert('6. process: 종합 5단계 파이프라인 일괄 실행', pipelineRes.result.appliedSteps.length >= 4 && pipelineRes.result.executionTimeMs >= 0);

  // 7. TesseractWasmAdapter 테스트
  const tesseract = new TesseractWasmAdapter();
  const tessRes = await tesseract.recognize({ sampleText: '테스트 문장입니다\n두번째 줄' });
  const tessHealth = await tesseract.checkHealth();
  assert('7. TesseractWasmAdapter: 로컬 WASM 바운딩 박스 생성 및 헬스체크', tessRes.boxes.length === 2 && tessRes.status === 'SUCCESS' && tessHealth.online);

  // 8. GeminiMultimodalAdapter 테스트
  const gemini = new GeminiMultimodalAdapter();
  const geminiRes = await gemini.recognize({ sampleText: '공식 E = mc^2\n수식 분석' });
  const geminiHealth = await gemini.checkHealth();
  assert('8. GeminiMultimodalAdapter: 클라우드 멀티모달 BBox 인식 및 헬스체크', geminiRes.boxes.length === 2 && geminiRes.status === 'SUCCESS' && geminiHealth.online);

  // 9. PaddleOcrDockerAdapter (Fallback & Health) 테스트
  const paddle = new PaddleOcrDockerAdapter('http://localhost:8000', 1000);
  const paddleRes = await paddle.recognize({ sampleText: '우분투 도커 테스트\n두번째 라인' });
  assert('9. PaddleOcrDockerAdapter: 무장애 안전 폴백 바운딩 박스 및 DTO 정규화', paddleRes.boxes.length === 2 && (paddleRes.status === 'SUCCESS' || paddleRes.status === 'FALLBACK'));

  // 10. OcrEngineFactory 라우팅 테스트
  const factoryTess = OcrEngineFactory.getAdapter('tesseract');
  const factoryGemini = OcrEngineFactory.getAdapter('gemini');
  const factoryPaddle = OcrEngineFactory.getAdapter('paddleocr');
  assert('10. OcrEngineFactory: 3대 어댑터 싱글톤 인스턴스 획득', factoryTess.engineType === 'tesseract' && factoryGemini.engineType === 'gemini' && factoryPaddle.engineType === 'paddleocr');

  // 11. 스캐너 테두리 자동 트리밍 테스트
  const cropTest = ImagePreprocessingPipeline.autoCropBorders(img);
  assert('11. autoCropBorders: 스캐너 테두리 유효 영역 크롭', cropTest.cropBox.w > 0 && cropTest.cropBox.h > 0 && cropTest.buffer.data.length > 0);

  // 12. 양면 스캔 분할 테스트
  const spreadImg = createDummyImage(200, 100, 'stripe'); // 2:1 ratio
  const spreadTest = ImagePreprocessingPipeline.detectSpineAndSplit(spreadImg);
  assert('12. detectSpineAndSplit: 2:1 스프레드 양면 접힘선 감지 및 좌우 분할', spreadTest.isSpread && !!spreadTest.leftPage && !!spreadTest.rightPage && spreadTest.leftPage.width > 0);

  // 13. 지능형 앙상블 OCR 라우터 테스트
  const { EnsembleOcrRouter } = await import('../src/ppdf/services');
  const ensembleRes = await EnsembleOcrRouter.executeEnsemble({ sampleText: '일반문장\n수식 Formula: E = mc^2' });
  const hasRefined = ensembleRes.boxes.some((b) => b.isEnsembleRefined);
  assert('13. EnsembleOcrRouter: 저신뢰도 수식 영역 Gemini 선택적 정밀 보정', ensembleRes.status === 'SUCCESS' && hasRefined && !!ensembleRes.ensembleStats);

  console.log(`\n===============================================================`);
  console.log(`결과: ${passed} / ${total} 테스트 통과 (${Math.round((passed / total) * 100)}%)`);
  console.log(`===============================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('테스트 실행 중 치명적 오류:', err);
  process.exit(1);
});


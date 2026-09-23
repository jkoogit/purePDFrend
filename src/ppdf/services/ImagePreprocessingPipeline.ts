/**
 * @file ImagePreprocessingPipeline.ts
 * @description 스캔 도서 및 문서 이미지 고정밀 전처리 파이프라인
 * (그레이스케일, 적응형 이진화, 투영 기반 기울기 자동 보정(Deskew), 노이즈 제거, 대비 향상)
 */

import { ImagePreprocessingOptions } from '../../types';

export interface RawImageBuffer {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
}

export interface PreprocessingResult {
  width: number;
  height: number;
  deskewAngle: number;
  executionTimeMs: number;
  appliedSteps: string[];
}

export class ImagePreprocessingPipeline {
  /**
   * 1. 표준 Luminance 가중치 기반 그레이스케일 변환
   * Y = 0.299*R + 0.587*G + 0.114*B
   */
  public static toGrayscale(img: RawImageBuffer): RawImageBuffer {
    const { data, width, height } = img;
    const output = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      output[i] = gray;
      output[i + 1] = gray;
      output[i + 2] = gray;
      output[i + 3] = a;
    }

    return { data: output, width, height };
  }

  /**
   * 2. 국소 적응형 이진화 (Adaptive Threshold Binarization)
   * 조명 불균일 및 그림자를 보정하여 텍스트를 선명한 흑백으로 분리
   */
  public static adaptiveBinarize(
    img: RawImageBuffer,
    thresholdOffset: number = 128
  ): RawImageBuffer {
    const { data, width, height } = img;
    const output = new Uint8ClampedArray(data.length);

    // 1단계: 전체 평균 밝기 계산
    let sum = 0;
    const totalPixels = width * height;
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i]; // 그레이스케일 가정
    }
    const globalMean = totalPixels > 0 ? sum / totalPixels : 128;
    const effectiveThreshold = Math.min(240, Math.max(15, (globalMean + thresholdOffset) / 2));

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i];
      const binary = gray < effectiveThreshold ? 0 : 255;
      output[i] = binary;
      output[i + 1] = binary;
      output[i + 2] = binary;
      output[i + 3] = 255;
    }

    return { data: output, width, height };
  }

  /**
   * 3. 수평 투영 분산(Horizontal Projection Variance) 기반 기울기 각도(Deskew Angle) 자동 추정
   * 텍스트 라인이 수평일 때 수평 프로파일의 분산(Variance)이 극대화되는 원리 이용
   */
  public static estimateDeskewAngle(
    img: RawImageBuffer,
    maxAngleDeg: number = 15,
    angleStep: number = 0.5
  ): number {
    const { data, width, height } = img;
    if (width === 0 || height === 0) return 0;

    let bestAngle = 0;
    let maxVariance = -1;

    // 계산 효율을 위해 샘플링 스텝 적용
    const sampleStep = Math.max(1, Math.floor(height / 300));

    for (let angle = -maxAngleDeg; angle <= maxAngleDeg; angle += angleStep) {
      const rad = (angle * Math.PI) / 180;
      const sin = Math.sin(rad);
      const cos = Math.cos(rad);
      const midX = width / 2;
      const midY = height / 2;

      const profile = new Float64Array(height);
      const counts = new Uint32Array(height);

      for (let y = 0; y < height; y += sampleStep) {
        for (let x = 0; x < width; x += sampleStep) {
          // 회전 변환된 Y 좌표
          const rotY = Math.round((x - midX) * sin + (y - midY) * cos + midY);
          if (rotY >= 0 && rotY < height) {
            const idx = (y * width + x) * 4;
            const val = data[idx] < 128 ? 1 : 0; // 흑색(텍스트) 화소 카운트
            profile[rotY] += val;
            counts[rotY]++;
          }
        }
      }

      // 프로파일 분산 계산
      let sum = 0;
      let count = 0;
      for (let i = 0; i < height; i++) {
        if (counts[i] > 0) {
          sum += profile[i];
          count++;
        }
      }
      const mean = count > 0 ? sum / count : 0;
      let variance = 0;
      for (let i = 0; i < height; i++) {
        if (counts[i] > 0) {
          const diff = profile[i] - mean;
          variance += diff * diff;
        }
      }

      if (variance > maxVariance) {
        maxVariance = variance;
        bestAngle = angle;
      }
    }

    return Math.round(bestAngle * 10) / 10;
  }

  /**
   * 4. 양선형 보간(Bilinear Interpolation) 기반 이미지 회전 교정 (Deskew)
   */
  public static rotateImage(img: RawImageBuffer, angleDeg: number): RawImageBuffer {
    if (Math.abs(angleDeg) < 0.1) return img;

    const { data, width, height } = img;
    const output = new Uint8ClampedArray(data.length);
    output.fill(255); // 흰색 배경

    const rad = (-angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const midX = width / 2;
    const midY = height / 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 역방향 매핑
        const srcX = (x - midX) * cos - (y - midY) * sin + midX;
        const srcY = (x - midX) * sin + (y - midY) * cos + midY;

        const dstIdx = (y * width + x) * 4;

        if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) {
          const x0 = Math.floor(srcX);
          const y0 = Math.floor(srcY);
          const x1 = x0 + 1;
          const y1 = y0 + 1;

          const wx = srcX - x0;
          const wy = srcY - y0;

          const idx00 = (y0 * width + x0) * 4;
          const idx10 = (y0 * width + x1) * 4;
          const idx01 = (y1 * width + x0) * 4;
          const idx11 = (y1 * width + x1) * 4;

          for (let c = 0; c < 3; c++) {
            const top = data[idx00 + c] * (1 - wx) + data[idx10 + c] * wx;
            const bottom = data[idx01 + c] * (1 - wx) + data[idx11 + c] * wx;
            output[dstIdx + c] = Math.round(top * (1 - wy) + bottom * wy);
          }
          output[dstIdx + 3] = 255;
        }
      }
    }

    return { data: output, width, height };
  }

  /**
   * 5. 3x3 미디언 필터 기반 노이즈 제거 (Salt-and-Pepper Denoising)
   */
  public static denoise(img: RawImageBuffer): RawImageBuffer {
    const { data, width, height } = img;
    const output = new Uint8ClampedArray(data.length);
    output.set(data);

    const window = new Uint8Array(9);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let k = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            window[k++] = data[idx];
          }
        }
        window.sort();
        const median = window[4];

        const dstIdx = (y * width + x) * 4;
        output[dstIdx] = median;
        output[dstIdx + 1] = median;
        output[dstIdx + 2] = median;
        output[dstIdx + 3] = data[dstIdx + 3];
      }
    }

    return { data: output, width, height };
  }

  /**
   * 6. 대비 향상 (Contrast Enhancement via Histogram Stretching)
   */
  public static enhanceContrast(img: RawImageBuffer): RawImageBuffer {
    const { data, width, height } = img;
    const output = new Uint8ClampedArray(data.length);

    let minVal = 255;
    let maxVal = 0;

    for (let i = 0; i < data.length; i += 4) {
      const v = data[i];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }

    const range = maxVal - minVal;
    if (range <= 0) return img;

    for (let i = 0; i < data.length; i += 4) {
      const v = data[i];
      const stretched = Math.round(((v - minVal) / range) * 255);
      output[i] = stretched;
      output[i + 1] = stretched;
      output[i + 2] = stretched;
      output[i + 3] = data[i + 3];
    }

    return { data: output, width, height };
  }

  /**
   * 7. 이미지 영역 크롭 (Crop Subregion)
   */
  public static crop(
    img: RawImageBuffer,
    cropX: number,
    cropY: number,
    cropW: number,
    cropH: number
  ): RawImageBuffer {
    const { data, width, height } = img;
    const safeX = Math.max(0, Math.min(width - 1, Math.floor(cropX)));
    const safeY = Math.max(0, Math.min(height - 1, Math.floor(cropY)));
    const safeW = Math.max(1, Math.min(width - safeX, Math.floor(cropW)));
    const safeH = Math.max(1, Math.min(height - safeY, Math.floor(cropH)));

    const output = new Uint8ClampedArray(safeW * safeH * 4);

    for (let y = 0; y < safeH; y++) {
      for (let x = 0; x < safeW; x++) {
        const srcIdx = ((safeY + y) * width + (safeX + x)) * 4;
        const dstIdx = (y * safeW + x) * 4;

        output[dstIdx] = data[srcIdx];
        output[dstIdx + 1] = data[srcIdx + 1];
        output[dstIdx + 2] = data[srcIdx + 2];
        output[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    return { data: output, width: safeW, height: safeH };
  }

  /**
   * 8. 스캐너 검은 테두리 및 그림자 여백 자동 트리밍 (Auto Margin / Black Border Crop)
   */
  public static autoCropBorders(
    img: RawImageBuffer,
    darkThreshold: number = 35
  ): { buffer: RawImageBuffer; cropBox: { x: number; y: number; w: number; h: number } } {
    const { data, width, height } = img;
    if (width <= 10 || height <= 10) {
      return { buffer: img, cropBox: { x: 0, y: 0, w: width, h: height } };
    }

    // 상단 테두리 검출
    let top = 0;
    for (let y = 0; y < Math.floor(height * 0.25); y++) {
      let rowAvg = 0;
      for (let x = 0; x < width; x += 4) {
        rowAvg += data[(y * width + x) * 4];
      }
      rowAvg /= (width / 4);
      if (rowAvg > darkThreshold) {
        top = Math.max(0, y - 1);
        break;
      }
    }

    // 하단 테두리 검출
    let bottom = height - 1;
    for (let y = height - 1; y >= Math.floor(height * 0.75); y--) {
      let rowAvg = 0;
      for (let x = 0; x < width; x += 4) {
        rowAvg += data[(y * width + x) * 4];
      }
      rowAvg /= (width / 4);
      if (rowAvg > darkThreshold) {
        bottom = Math.min(height - 1, y + 1);
        break;
      }
    }

    // 좌측 테두리 검출
    let left = 0;
    for (let x = 0; x < Math.floor(width * 0.25); x++) {
      let colAvg = 0;
      for (let y = 0; y < height; y += 4) {
        colAvg += data[(y * width + x) * 4];
      }
      colAvg /= (height / 4);
      if (colAvg > darkThreshold) {
        left = Math.max(0, x - 1);
        break;
      }
    }

    // 우측 테두리 검출
    let right = width - 1;
    for (let x = width - 1; x >= Math.floor(width * 0.75); x--) {
      let colAvg = 0;
      for (let y = 0; y < height; y += 4) {
        colAvg += data[(y * width + x) * 4];
      }
      colAvg /= (height / 4);
      if (colAvg > darkThreshold) {
        right = Math.min(width - 1, x + 1);
        break;
      }
    }

    const cropW = Math.max(10, right - left + 1);
    const cropH = Math.max(10, bottom - top + 1);

    const cropped = this.crop(img, left, top, cropW, cropH);
    return {
      buffer: cropped,
      cropBox: { x: left, y: top, w: cropW, h: cropH },
    };
  }

  /**
   * 9. 양면 스캔 분할 (Spread Split / Spine Crease Detection)
   * 책 중앙 접힘선(Spine)의 세로 그림자 계곡(Vertical Valley)을 감지하여 좌/우 페이지 분리
   */
  public static detectSpineAndSplit(
    img: RawImageBuffer
  ): { isSpread: boolean; spineX: number; leftPage?: RawImageBuffer; rightPage?: RawImageBuffer } {
    const { data, width, height } = img;
    const aspectRatio = width / (height || 1);

    // 가로가 세로보다 1.25배 이상 긴 양면 스캔 이미지 판별
    if (aspectRatio < 1.25) {
      return { isSpread: false, spineX: Math.floor(width / 2) };
    }

    // 중앙 35% ~ 65% 구간에서 가장 어둡거나 그림자가 진 세로선(Spine) 탐색
    const startX = Math.floor(width * 0.35);
    const endX = Math.floor(width * 0.65);

    let minAvg = 999999;
    let spineX = Math.floor(width / 2);

    for (let x = startX; x <= endX; x += 2) {
      let colSum = 0;
      for (let y = 0; y < height; y += 4) {
        const idx = (y * width + x) * 4;
        colSum += data[idx];
      }
      const avg = colSum / (height / 4);
      if (avg < minAvg) {
        minAvg = avg;
        spineX = x;
      }
    }

    const leftPage = this.crop(img, 0, 0, spineX, height);
    const rightPage = this.crop(img, spineX, 0, width - spineX, height);

    return {
      isSpread: true,
      spineX,
      leftPage,
      rightPage,
    };
  }

  /**
   * 종합 전처리 파이프라인 일괄 실행기
   */
  public static process(
    input: RawImageBuffer,
    options: ImagePreprocessingOptions = {}
  ): { buffer: RawImageBuffer; result: PreprocessingResult; splitPages?: { left: RawImageBuffer; right: RawImageBuffer } } {
    const t0 = Date.now();
    let current = input;
    const appliedSteps: string[] = [];
    let detectedAngle = 0;
    let splitPages: { left: RawImageBuffer; right: RawImageBuffer } | undefined = undefined;

    // 1. 그레이스케일
    if (options.grayscale !== false) {
      current = this.toGrayscale(current);
      appliedSteps.push('그레이스케일 변환');
    }

    // 2. 스캐너 검은 테두리 자동 트리밍
    if (options.autoCrop) {
      const cropResult = this.autoCropBorders(current);
      current = cropResult.buffer;
      appliedSteps.push(`스캐너 테두리 자동 트리밍 (${cropResult.cropBox.w}x${cropResult.cropBox.h})`);
    }

    // 3. 대비 향상
    if (options.contrastEnhance) {
      current = this.enhanceContrast(current);
      appliedSteps.push('대비 히스토그램 평활화');
    }

    // 4. 노이즈 제거
    if (options.denoise) {
      current = this.denoise(current);
      appliedSteps.push('3x3 미디언 노이즈 필터링');
    }

    // 5. 기울기 자동 보정 (Deskew)
    if (options.deskew) {
      detectedAngle = this.estimateDeskewAngle(current);
      if (Math.abs(detectedAngle) >= 0.2) {
        current = this.rotateImage(current, detectedAngle);
        appliedSteps.push(`기울기 자동 보정 (${detectedAngle > 0 ? '+' : ''}${detectedAngle}°)`);
      }
    }

    // 6. 양면 스캔 분할 (Spread Split)
    if (options.splitSpread) {
      const spreadInfo = this.detectSpineAndSplit(current);
      if (spreadInfo.isSpread && spreadInfo.leftPage && spreadInfo.rightPage) {
        splitPages = { left: spreadInfo.leftPage, right: spreadInfo.rightPage };
        appliedSteps.push(`양면 스캔 자동 분할 (접힘선 X: ${spreadInfo.spineX}px)`);
      }
    }

    // 7. 이진화
    if (options.binarization) {
      current = this.adaptiveBinarize(current, options.binarizationThreshold ?? 128);
      appliedSteps.push('적응형 흑백 이진화(Adaptive Binarization)');
    }

    const duration = Date.now() - t0;

    return {
      buffer: current,
      splitPages,
      result: {
        width: current.width,
        height: current.height,
        deskewAngle: detectedAngle,
        executionTimeMs: duration,
        appliedSteps,
      },
    };
  }
}

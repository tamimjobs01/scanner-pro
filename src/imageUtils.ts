import { ScannedPage } from './types';

/**
 * Utility to process a base64 image using canvas and apply active enhancement parameters.
 * Returns a new base64 string.
 */
export function applyImageEnhancements(
  originalDataUrl: string,
  config: ScannedPage
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = originalDataUrl;

    img.onload = () => {
      // Create offscreen canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Handle raw rotation size swaps
      const is90or270 = config.rotation === 90 || config.rotation === 270;
      const width = is90or270 ? img.height : img.width;
      const height = is90or270 ? img.width : img.height;

      canvas.width = width;
      canvas.height = height;

      // Translate context to center for rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((config.rotation * Math.PI) / 180);

      // Draw original image centered
      const drawW = is90or270 ? height : width;
      const drawH = is90or270 ? width : height;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      // Reset transform before pixel manipulations
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Apply Crop if any
      if (config.cropRect) {
        const { x, y, w, h } = config.cropRect;
        // Bound checks
        const cropX = Math.max(0, Math.min(canvas.width, x));
        const cropY = Math.max(0, Math.min(canvas.height, y));
        const cropW = Math.max(10, Math.min(canvas.width - cropX, w));
        const cropH = Math.max(10, Math.min(canvas.height - cropY, h));

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext('2d');
        if (cropCtx) {
          cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          // Transfer to our primary canvas
          canvas.width = cropW;
          canvas.height = cropH;
          ctx.drawImage(cropCanvas, 0, 0);
        }
      }

      // Apply pixel adjustments if active
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Sliders defaults: brightness (0-100, default 50), contrast (0-100, default 50), saturation (0-100, default 50)
      const bFactor = (config.brightness - 50) * 3; // range -150 to +150
      const cFactor = (config.contrast - 50) / 50; // ratio -1.0 to 1.0
      // Scale: contrast adjust is (pixel - 128) * (1 + cFactor) + 128
      const cMult = cFactor >= 0 ? 1 + cFactor * 2 : 1 + cFactor;
      const sFactor = config.saturation / 50; // ratio 0.0 to 2.0 (50 is 1.0)

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // 1. Brightness
        r += bFactor;
        g += bFactor;
        b += bFactor;

        // 2. Contrast
        r = (r - 128) * cMult + 128;
        g = (g - 128) * cMult + 128;
        b = (b - 128) * cMult + 128;

        // 3. Saturation (Gray Weights: 0.299R, 0.587G, 0.114B)
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * sFactor;
        g = gray + (g - gray) * sFactor;
        b = gray + (b - gray) * sFactor;

        // 4. Filters (sepia, grayscale, invert, blur)
        if (config.filter === 'sepia') {
          const tr = 0.393 * r + 0.769 * g + 0.189 * b;
          const tg = 0.349 * r + 0.686 * g + 0.168 * b;
          const tb = 0.272 * r + 0.534 * g + 0.131 * b;
          r = tr;
          g = tg;
          b = tb;
        } else if (config.filter === 'grayscale') {
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          r = luma;
          g = luma;
          b = luma;
        } else if (config.filter === 'invert') {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }

        // 5. High-Contrast Black & White
        if (config.bwEnabled) {
          const grayVal = 0.299 * r + 0.587 * g + 0.114 * b;
          const bw = grayVal > config.bwThreshold ? 255 : 0;
          r = bw;
          g = bw;
          b = bw;
        }

        // Clamp values
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imgData, 0, 0);

      // Apply Sharpness Convolution Filter ([0, -1, 0, -1, 5, -1, 0, -1, 0])
      if (config.sharpness > 0) {
        sharpnessKernel(canvas, ctx, config.sharpness / 100);
      }

      // Output as optimized base64 jpeg
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}

function sharpnessKernel(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scalar: number) {
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const src = imgData.data;
  const dstData = ctx.createImageData(w, h);
  const dst = dstData.data;

  // Sharpness matrix: [0, -scalar, 0, -scalar, 1 + 4*scalar, -scalar, 0, -scalar, 0]
  const k = -scalar;
  const c = 1 + 4 * scalar;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      dst[idx + 3] = src[idx + 3]; // Alpha

      for (let ch = 0; ch < 3; ch++) {
        const val =
          src[((y - 1) * w + x) * 4 + ch] * k + // Top
          src[(y * w + (x - 1)) * 4 + ch] * k + // Left
          src[(y * w + x) * 4 + ch] * c + // Center
          src[(y * w + (x + 1)) * 4 + ch] * k + // Right
          src[((y + 1) * w + x) * 4 + ch] * k; // Bottom

        dst[idx + ch] = Math.max(0, Math.min(255, val));
      }
    }
  }
  ctx.putImageData(dstData, 0, 0);
}

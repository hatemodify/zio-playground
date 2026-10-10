import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { Landmark } from './poseClassifier';

const TRACKED = [11, 12, 23, 24, 25, 26, 27, 28] as const;
let detector: PoseLandmarker | null = null;

self.onmessage = async (event: MessageEvent<{ type: 'init'; baseUrl: string } | { type: 'frame'; bitmap: ImageBitmap; capturedAt: number }>) => {
  if (event.data.type === 'init') {
    try {
      const { baseUrl } = event.data;
      const files = await FilesetResolver.forVisionTasks(`${baseUrl}mediapipe/wasm`, true);
      detector = await PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: `${baseUrl}mediapipe/pose_landmarker_lite.task`, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.55,
        minPosePresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
        outputSegmentationMasks: false,
      });
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
    }
    return;
  }
  const { bitmap, capturedAt } = event.data;
  try {
    if (!detector) throw new Error('Pose Landmarker가 준비되지 않았습니다.');
    const startedAt = performance.now();
    const result = detector.detectForVideo(bitmap, capturedAt);
    const points = result.landmarks[0];
    const landmarks: Landmark[] = points ? TRACKED.map(index => ({
      // The preview is mirrored, so control directions match the child's view.
      x: 1 - points[index].x,
      y: points[index].y,
      visibility: points[index].visibility ?? 0,
    })) : [];
    self.postMessage({ type: 'pose', landmarks, capturedAt, inferenceMs: performance.now() - startedAt });
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  } finally {
    bitmap.close();
  }
};

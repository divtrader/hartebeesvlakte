/// <reference lib="webworker" />
// Runs the BirdNET V2.4 bird sound model off the main thread.
// The spectrogram layer and the WebGL STFT kernel are ported from birdnet-team/real-time-pwa
// (MIT licence, Copyright (c) 2025 BirdNET-Team), which is based on github.com/georg95/birdnet-web.
import * as tf from '@tensorflow/tfjs';
import type { FromWorker, Hit, ToWorker } from './protocol';

const WINDOW_SAMPLES = 144_000; // 3 seconds at 48 kHz
const scope = self as unknown as DedicatedWorkerGlobalScope;

let birdModel: tf.LayersModel | null = null;
let areaModel: tf.GraphModel | null = null;
let labels: { sci: string; en: string; af: string }[] = [];
let geo: Float32Array | null = null;

function post(message: FromWorker) {
  scope.postMessage(message);
}

interface MelConfig {
  name?: string;
  trainable?: boolean;
  specShape: [number, number];
  frameStep: number;
  frameLength: number;
  melFilterbank: number[][];
}

/** BirdNET's own layer: turns raw audio into a mel spectrogram inside the model. */
class MelSpecLayerSimple extends tf.layers.Layer {
  static className = 'MelSpecLayerSimple';
  private readonly specShape: [number, number];
  private readonly frameStep: number;
  private readonly frameLength: number;
  private readonly melFilterbank: tf.Tensor2D;
  private magScale!: tf.LayerVariable;

  constructor(config: MelConfig) {
    super(config);
    this.specShape = config.specShape;
    this.frameStep = config.frameStep;
    this.frameLength = config.frameLength;
    this.melFilterbank = tf.tensor2d(config.melFilterbank);
  }

  build(inputShape: tf.Shape | tf.Shape[]): void {
    this.magScale = this.addWeight('magnitude_scaling', [], 'float32', tf.initializers.constant({ value: 1.23 }));
    super.build(inputShape);
  }

  computeOutputShape(inputShape: tf.Shape | tf.Shape[]): tf.Shape {
    const shape = (Array.isArray(inputShape[0]) ? inputShape[0] : inputShape) as tf.Shape;
    return [shape[0], this.specShape[0], this.specShape[1], 1];
  }

  call(inputs: tf.Tensor | tf.Tensor[]): tf.Tensor {
    return tf.tidy(() => {
      const x = Array.isArray(inputs) ? inputs[0] : inputs;
      const onGpu = tf.getBackend() === 'webgl';
      const rows = tf.split(x, x.shape[0] ?? 1).map((row) => {
        let signal = row.reshape([-1]) as tf.Tensor1D;
        // Scale the window to -1 .. 1.
        signal = tf.sub(signal, tf.min(signal, -1, true));
        signal = tf.div(signal, tf.add(tf.max(signal, -1, true), 1e-6));
        signal = tf.mul(tf.sub(signal, 0.5), 2);
        // Real part of the short time Fourier transform, as in the original TensorFlow layer.
        let spec = onGpu
          ? (tf.engine().runKernel('STFT', { signal }, { frameLength: this.frameLength, frameStep: this.frameStep }) as tf.Tensor2D)
          : (tf.real(tf.signal.stft(signal, this.frameLength, this.frameStep)) as tf.Tensor2D);
        spec = tf.pow(tf.matMul(spec, this.melFilterbank), 2);
        spec = tf.pow(spec, tf.div(1, tf.add(1, tf.exp(this.magScale.read()))));
        spec = tf.reverse(spec, -1);
        return tf.expandDims(tf.transpose(spec), -1);
      });
      return tf.stack(rows);
    });
  }
}

interface WebGLBackend {
  runWebGLProgram(program: { variableNames: string[]; outputShape: number[]; userCode: string }, inputs: tf.TensorInfo[], dtype: 'float32'): tf.TensorInfo;
  disposeIntermediateTensorInfo(info: tf.TensorInfo): void;
}

// Windowed real FFT on the GPU, much faster than the generic FFT on phones.
tf.registerKernel({
  kernelName: 'STFT',
  backendName: 'webgl',
  kernelFunc: ({ backend, inputs, attrs }) => {
    const gl = backend as unknown as WebGLBackend;
    const signal = inputs.signal as tf.TensorInfo;
    const { frameLength, frameStep } = attrs as unknown as { frameLength: number; frameStep: number };
    const size = signal.shape.reduce((a, b) => a * b, 1);
    const innerDim = frameLength / 2;
    const bits = Math.log2(innerDim);
    const batch = ((size - frameLength + frameStep) / frameStep) | 0;

    let current = gl.runWebGLProgram(
      {
        variableNames: ['x'],
        outputShape: [batch, frameLength],
        userCode: `void main(){
          ivec2 c=getOutputCoords();
          int p=c[1]%${innerDim};
          int k=0;
          for(int i=0;i<${bits};++i){
            if((p & (1<<i))!=0){ k|=(1<<(${bits - 1}-i)); }
          }
          int i=2*k;
          if(c[1]>=${innerDim}){ i=2*(k%${innerDim})+1; }
          int q=c[0]*${frameLength}+i;
          float val=getX((q/${frameLength})*${frameStep}+ q % ${frameLength});
          float cosArg=${(2.0 * Math.PI) / frameLength}*float(q);
          float mul=0.5-0.5*cos(cosArg);
          setOutput(val*mul);
        }`,
      },
      [signal],
      'float32',
    );

    for (let len = 1; len < innerDim; len *= 2) {
      const previous = current;
      current = gl.runWebGLProgram(
        {
          variableNames: ['x'],
          outputShape: [batch, innerDim * 2],
          userCode: `void main(){
            ivec2 c=getOutputCoords();
            int b=c[0];
            int i=c[1];
            int k=i%${innerDim};
            int isHigh=(k%${len * 2})/${len};
            int highSign=(1 - isHigh*2);
            int baseIndex=k - isHigh*${len};
            float t=${Math.PI / len}*float(k%${len});
            float a=cos(t);
            float bsin=sin(-t);
            float oddK_re=getX(b, baseIndex+${len});
            float oddK_im=getX(b, baseIndex+${len + innerDim});
            if(i<${innerDim}){
              float evenK_re=getX(b, baseIndex);
              setOutput(evenK_re + (oddK_re*a - oddK_im*bsin)*float(highSign));
            } else {
              float evenK_im=getX(b, baseIndex+${innerDim});
              setOutput(evenK_im + (oddK_re*bsin + oddK_im*a)*float(highSign));
            }
          }`,
        },
        [previous],
        'float32',
      );
      gl.disposeIntermediateTensorInfo(previous);
    }

    const real = gl.runWebGLProgram(
      {
        variableNames: ['x'],
        outputShape: [batch, innerDim + 1],
        userCode: `void main(){
          ivec2 c=getOutputCoords();
          int b=c[0];
          int i=c[1];
          int zI=i%${innerDim};
          int conjI=(${innerDim}-i)%${innerDim};
          float Zk0=getX(b,zI);
          float Zk1=getX(b,zI+${innerDim});
          float Zk_conj0=getX(b,conjI);
          float Zk_conj1=-getX(b,conjI+${innerDim});
          float t=${-2.0 * Math.PI}*float(i)/float(${innerDim * 2});
          float diff0=Zk0 - Zk_conj0;
          float diff1=Zk1 - Zk_conj1;
          float result=(Zk0+Zk_conj0 + cos(t)*diff1 + sin(t)*diff0)*0.5;
          setOutput(result);
        }`,
      },
      [current],
      'float32',
    );
    gl.disposeIntermediateTensorInfo(current);
    return real;
  },
});

function splitLabel(line: string): [string, string] {
  const cut = line.indexOf('_');
  return cut < 0 ? [line, line] : [line.slice(0, cut), line.slice(cut + 1)];
}

async function load(base: string, preferred: 'webgl' | 'cpu' = 'webgl') {
  if (birdModel) {
    post({ type: 'ready', backend: tf.getBackend(), classes: labels.length, hasArea: areaModel !== null });
    return;
  }
  let backendOk = false;
  try {
    backendOk = await tf.setBackend(preferred);
  } catch {
    backendOk = false;
  }
  if (!backendOk) await tf.setBackend('cpu');
  await tf.ready();
  tf.serialization.registerClass(MelSpecLayerSimple);

  birdModel = await tf.loadLayersModel(`${base}model.json`, { onProgress: (p) => post({ type: 'progress', progress: p * 0.8 }) });
  post({ type: 'progress', progress: 0.85 });
  tf.tidy(() => {
    birdModel!.predict(tf.zeros([1, WINDOW_SAMPLES]));
  });

  post({ type: 'progress', progress: 0.92 });
  try {
    areaModel = await tf.loadGraphModel(`${base}area-model/model.json`);
  } catch {
    areaModel = null;
  }

  const [en, af] = await Promise.all(['labels/en_uk.txt', 'labels/af.txt'].map((f) => fetch(base + f).then((r) => r.text())));
  const afLines = af.split('\n');
  labels = en
    .split('\n')
    .filter((line) => line.trim())
    .map((line, i) => {
      const [sci, common] = splitLabel(line.trim());
      const [, afName] = splitLabel((afLines[i] ?? line).trim());
      return { sci, en: common, af: afName || common };
    });
  post({ type: 'ready', backend: tf.getBackend(), classes: labels.length, hasArea: areaModel !== null });
}

async function area(lat: number, lng: number, week: number) {
  if (!areaModel) {
    post({ type: 'area', expected: -1 });
    return;
  }
  const input = tf.tensor2d([[lat, lng, week]]);
  const output = areaModel.predict(input) as tf.Tensor;
  geo = (await output.data()) as Float32Array;
  input.dispose();
  output.dispose();
  let expected = 0;
  for (const g of geo) if (g >= 0.03) expected += 1;
  post({ type: 'area', expected });
}

async function predict(id: number, pcm: Float32Array, minScore: number) {
  if (!birdModel) throw new Error('The bird model is not loaded yet');
  const started = performance.now();
  const input = tf.tensor2d(pcm, [1, WINDOW_SAMPLES]);
  const output = birdModel.predict(input) as tf.Tensor;
  const scores = await output.data();
  input.dispose();
  output.dispose();
  const hits: Hit[] = [];
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] >= minScore && labels[i]) hits.push({ index: i, ...labels[i], score: scores[i], geo: geo ? geo[i] : 1 });
  }
  hits.sort((a, b) => b.score - a.score);
  post({ type: 'result', id, hits: hits.slice(0, 25), ms: Math.round(performance.now() - started) });
}

scope.onmessage = async (event: MessageEvent<ToWorker>) => {
  const msg = event.data;
  try {
    if (msg.type === 'load') await load(msg.base, msg.backend);
    else if (msg.type === 'area') await area(msg.lat, msg.lng, msg.week);
    else if (msg.type === 'predict') await predict(msg.id, msg.pcm, msg.minScore);
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};

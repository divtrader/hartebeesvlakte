// Collects microphone samples in blocks of 4800 (0.1 s at 48 kHz) and hands them to the page.
class VeldboekCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.block = new Float32Array(4800);
    this.index = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        this.block[this.index++] = channel[i];
        if (this.index === this.block.length) {
          this.port.postMessage(this.block.slice());
          this.index = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('veldboek-capture', VeldboekCapture);

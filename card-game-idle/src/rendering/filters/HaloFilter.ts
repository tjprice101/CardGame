import { Filter, GlProgram, UniformGroup, defaultFilterVert } from 'pixi.js';
import fragSrc from './shaders/halo.frag';

export class HaloFilter extends Filter {
  constructor() {
    const glProgram = GlProgram.from({
      vertex: defaultFilterVert,
      fragment: fragSrc,
      name: 'halo-filter',
    });

    const haloUniforms = new UniformGroup({
      uTime:         { value: 0,                               type: 'f32'       },
      uRadius:       { value: 0.38,                            type: 'f32'       },
      uThickness:    { value: 0.04,                            type: 'f32'       },
      uGlowColor:    { value: new Float32Array([1, 0.84, 0]),  type: 'vec3<f32>' },
      uPulseSpeed:   { value: 2.0,                             type: 'f32'       },
      uPulseStrength:{ value: 0.3,                             type: 'f32'       },
    });

    super({ glProgram, resources: { haloUniforms } });
  }

  get time(): number { return this.resources.haloUniforms.uniforms.uTime as number; }
  set time(v: number) { this.resources.haloUniforms.uniforms.uTime = v; }

  setGlowColor(r: number, g: number, b: number): void {
    const arr = this.resources.haloUniforms.uniforms.uGlowColor as Float32Array;
    arr[0] = r; arr[1] = g; arr[2] = b;
  }

  get radius(): number { return this.resources.haloUniforms.uniforms.uRadius as number; }
  set radius(v: number) { this.resources.haloUniforms.uniforms.uRadius = v; }
}

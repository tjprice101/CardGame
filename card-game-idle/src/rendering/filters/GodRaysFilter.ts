import { Filter, GlProgram, UniformGroup, defaultFilterVert } from 'pixi.js';
import fragSrc from './shaders/godRays.frag';

export class GodRaysFilter extends Filter {
  constructor() {
    const glProgram = GlProgram.from({
      vertex: defaultFilterVert,
      fragment: fragSrc,
      name: 'god-rays-filter',
    });

    const godRaysUniforms = new UniformGroup({
      uTime:      { value: 0,                               type: 'f32'        },
      uCenter:    { value: new Float32Array([0.5, 0.5]),    type: 'vec2<f32>'  },
      uRayColor:  { value: new Float32Array([1, 0.84, 0]),  type: 'vec3<f32>'  },
      uIntensity: { value: 0.25,                            type: 'f32'        },
    });

    super({ glProgram, resources: { godRaysUniforms } });
  }

  get time(): number { return this.resources.godRaysUniforms.uniforms.uTime as number; }
  set time(v: number) { this.resources.godRaysUniforms.uniforms.uTime = v; }

  get intensity(): number { return this.resources.godRaysUniforms.uniforms.uIntensity as number; }
  set intensity(v: number) { this.resources.godRaysUniforms.uniforms.uIntensity = v; }

  setCenter(x: number, y: number): void {
    const arr = this.resources.godRaysUniforms.uniforms.uCenter as Float32Array;
    arr[0] = x; arr[1] = y;
  }

  setRayColor(r: number, g: number, b: number): void {
    const arr = this.resources.godRaysUniforms.uniforms.uRayColor as Float32Array;
    arr[0] = r; arr[1] = g; arr[2] = b;
  }
}

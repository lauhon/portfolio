"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Scene } from "./scene";
export default function MyCanvas() {
  return (
    <Canvas
      style={{ height: "100vh" }}
      orthographic
      gl={{ antialias: false }}
      camera={{ position: [0, 0, 100], zoom: 70 }}
    >
      <color attach="background" args={["#000"]} />
      <Scene />
      <EffectComposer disableNormalPass>
        <Bloom
          mipmapBlur
          levels={9}
          intensity={1.5}
          luminanceThreshold={1}
          luminanceSmoothing={1}
        />
        {/* <Sepia
          intensity={0.5} // sepia intensity
          blendFunction={BlendFunction.COLOR_BURN} // blend mode
        /> */}

        {/* <Sepia
          intensity={0.1} // sepia intensity
          blendFunction={BlendFunction.DIVIDE} // blend mode
        /> */}
        {/* <Pixelation
          granularity={1} // pixel granularity
        /> */}
      </EffectComposer>
    </Canvas>
  );
}

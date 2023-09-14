"use client";

import { Canvas } from "@react-three/fiber";
import { Scene } from "./scene";

export default function MyCanvas() {
  return (
    <Canvas style={{ height: "100vh" }} orthographic camera={{ zoom: 100 }}>
      <color attach="background" args={["#000"]} />
      <Scene />
    </Canvas>
  );
}

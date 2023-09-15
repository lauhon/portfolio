"use client";
import { extend, useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";
import * as THREE from "three";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import roboto from "./Roboto.json";
import { Beam } from "./beam";
import { Flare } from "./flare";
import { Shader } from "./shader";
extend({ TextGeometry });

function lerp(object, prop, goal, speed = 0.1) {
  object[prop] = THREE.MathUtils.lerp(object[prop], goal, speed);
}

const vector = new THREE.Vector3();
function lerpV3(value, goal, speed = 0.1) {
  value.lerp(vector.set(...goal), speed);
}

function calculateRefractionAngle(
  incidentAngle,
  glassIor = 2.5,
  airIor = 1.000293
) {
  const theta = Math.asin((airIor * Math.sin(incidentAngle)) / glassIor) || 0;
  return theta;
}

export function Scene() {
  const [isPrismHit, hitPrism] = useState(false);
  const flare = useRef(null);
  const ambient = useRef(null);
  const spot = useRef(null);
  const boxreflect = useRef(null);
  const rainbow = useRef(null);

  console.log({ flare, boxreflect });

  const rayOut = useCallback(() => hitPrism(false), []);
  const rayOver = useCallback((e) => {
    // Break raycast so the ray stops when it touches the prism.
    e.stopPropagation();
    hitPrism(true);
    // Set the intensity really high on first contact.
    rainbow.current.material.speed = 1;
    rainbow.current.material.emissiveIntensity = 20;
  }, []);

  const vec = new THREE.Vector3();
  const rayMove = useCallback(({ api, position, direction, normal }) => {
    if (!normal) return;
    // Extend the line to the prisms center.
    vec.toArray(api.positions, api.number++ * 3);
    // Set flare.
    flare.current.position.set(position.x, position.y, -0.5);
    flare.current.rotation.set(0, 0, -Math.atan2(direction.x, direction.y));

    rainbow.current.position.set(position.x, position.y, -0.5);
    flare.current.rotation.set(0, 0, -Math.atan2(direction.y, direction.x));

    // Calculate refraction angles.
    let angleScreenCenter = Math.atan2(-position.y, -position.x);
    const normalAngle = Math.atan2(normal.y, normal.x);

    // The angle between the ray and the normal.
    const incidentAngle = angleScreenCenter - normalAngle;

    // Calculate the refraction for the incident angle.
    const refractionAngle = calculateRefractionAngle(incidentAngle) * 6;

    // Apply the refraction.
    angleScreenCenter += refractionAngle;
    rainbow.current.rotation.z = angleScreenCenter;

    // Set spot light.
    lerpV3(
      spot.current.target.position,
      [Math.cos(angleScreenCenter), Math.sin(angleScreenCenter), 0],
      0.05
    );
    spot.current.target.updateMatrixWorld();
  }, []);

  useFrame((state) => {
    // Tie beam to the mouse.
    boxreflect.current.setRay(
      [
        (state.pointer.x * state.viewport.width) / 2,
        (state.pointer.y * state.viewport.height) / 2,
        0,
      ],
      [0, 0, 0]
    );

    // Animate rainbow intensity.
    lerp(
      rainbow.current.material,
      "emissiveIntensity",
      isPrismHit ? 2.5 : 0,
      0.1
    );
    spot.current.intensity = rainbow.current.material.emissiveIntensity;

    // Animate ambience.
    lerp(ambient.current, "intensity", 0, 0.025);
  });

  return (
    <>
      {/* Lights */}
      <ambientLight ref={ambient} intensity={0} />
      <pointLight position={[10, -10, 0]} intensity={0.05} />
      <pointLight position={[0, 10, 0]} intensity={0.05} />
      <pointLight position={[-10, 0, 0]} intensity={0.05} />
      <spotLight
        ref={spot}
        intensity={1}
        distance={7}
        angle={1}
        penumbra={1}
        position={[0, 0, 1]}
      />
      {/* Prism + blocks + reflect beam */}
      <Beam ref={boxreflect} bounce={10} far={20}>
        <Text
          scale={1}
          position={[-3, 0, 0]}
          onRayOver={rayOver}
          onRayOut={rayOut}
          onRayMove={rayMove}
        />

        {/* <Block position={[-1.4, 1, 0]} rotation={[0, 0, Math.PI / 8]} />
        <Block position={[-2.4, -1, 0]} rotation={[0, 0, Math.PI / -4]} /> */}
      </Beam>
      {/* Rainbow and flares */}
      <Shader
        ref={rainbow}
        // position={spot.current.position}
        startRadius={0}
        endRadius={0.5}
        fade={0}
      />
      <Flare
        ref={flare}
        visible={isPrismHit}
        renderOrder={10}
        scale={1.25}
        streak={[12.5, 20, 1]}
      />
    </>
  );
}

export function Block({ onRayOver, ...props }) {
  const [hovered, hover] = useState(false);
  return (
    <mesh
      onRayOver={(e) => hover(true)}
      onRayOut={(e) => hover(false)}
      {...props}
    >
      <boxGeometry />
      <meshBasicMaterial color={hovered ? "orange" : "white"} />
    </mesh>
  );
}

export function Triangle({ onRayOver, ...props }) {
  const [hovered, hover] = useState(false);
  return (
    <mesh
      {...props}
      onRayOver={(e) => (e.stopPropagation(), hover(true))}
      onRayOut={(e) => hover(false)}
      onRayMove={(e) => null /*console.log(e.direction)*/}
    >
      <cylinderGeometry args={[1, 1, 1, 3, 1]} />
      <meshBasicMaterial color={hovered ? "hotpink" : "white"} />
    </mesh>
  );
}

function Text({ onRayOver, onRayOut, onRayMove, ...props }) {
  const loader = new FontLoader();
  const font = loader.parse(roboto);

  const [hovered, hover] = useState(false);

  const vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );

  const size = vw < 1500 ? 0.5 : 1;

  return (
    <group {...props}>
      <mesh onRayOver={onRayOver} onRayOut={onRayOut} onRayMove={onRayMove}>
        <textGeometry args={["Laurenz Honauer", { font, size, height: 1 }]} />
        <meshBasicMaterial color="#000" opacity={1} />
      </mesh>
    </group>
  );
}

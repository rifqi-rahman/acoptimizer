import React, { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { FloorModel } from "../../building/params";
import { useViewStore } from "../../stores/viewStore";
import { Building3D } from "./Building3D";

interface TwinCanvasProps {
  floors: FloorModel[];
}

// Controller navigasi kamera cerdas: mendukung animasi transisi antar lantai/gedung,
// sinkronisasi kompas, dan reset ke arah Utara
function TwinCameraController({ floors }: { floors: FloorModel[] }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { mode, selectedFloor, selectedSlotId, setCameraAzimuth, resetCameraTrigger } =
    useViewStore();
  const { camera } = useThree();

  // Target posisi kamera & titik pusat orbit
  const desiredTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const desiredPosRef = useRef(new THREE.Vector3(75, 58, 88));
  const isTransitioningRef = useRef(false);

  // Cari koordinat ruangan jika sedang dalam mode room
  const activeRoom = React.useMemo(() => {
    if (!selectedSlotId) return null;
    for (const f of floors) {
      const found = f.rooms.find((r) => r.slotId === selectedSlotId);
      if (found) return found;
    }
    return null;
  }, [floors, selectedSlotId]);

  // Perbarui target navigasi kamera saat mode/lantai/ruang berubah
  useEffect(() => {
    isTransitioningRef.current = true;

    if (mode === "building") {
      desiredTargetRef.current.set(0, 2, 0);
      desiredPosRef.current.set(78, 56, 88);
    } else if (mode === "floor" || !activeRoom) {
      const yFloor = -12 + (selectedFloor - 1) * 4.6;
      desiredTargetRef.current.set(0, yFloor + 1, 0);
      desiredPosRef.current.set(0, yFloor + 50, 56);
    } else if (mode === "room" && activeRoom) {
      const yFloor = -12 + (selectedFloor - 1) * 4.6;
      const rx = activeRoom.center[0];
      const rz = -activeRoom.center[1];
      desiredTargetRef.current.set(rx, yFloor + 1, rz);
      desiredPosRef.current.set(rx + 16, yFloor + 22, rz + 18);
    }
  }, [mode, selectedFloor, selectedSlotId, activeRoom]);

  // Handler reset orientasi kamera ke Arah Utara saat tombol kompas ditekan
  useEffect(() => {
    if (resetCameraTrigger > 0) {
      isTransitioningRef.current = true;
      if (mode === "building") {
        desiredTargetRef.current.set(0, 2, 0);
        desiredPosRef.current.set(0, 56, 88);
      } else {
        const yFloor = -12 + (selectedFloor - 1) * 4.6;
        desiredTargetRef.current.set(0, yFloor + 1, 0);
        desiredPosRef.current.set(0, yFloor + 50, 56);
      }
    }
  }, [resetCameraTrigger, mode, selectedFloor]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    // Lacak sudut azimuth kamera untuk kompas HUD
    const azimuth = controlsRef.current.getAzimuthalAngle();
    setCameraAzimuth(azimuth);

    // Animasi transisi kamera yang mulus dan elastis (Damping)
    if (isTransitioningRef.current) {
      const lerpSpeed = Math.min(delta * 4.0, 0.15);

      controlsRef.current.target.lerp(desiredTargetRef.current, lerpSpeed);
      camera.position.lerp(desiredPosRef.current, lerpSpeed);

      const distTarget = controlsRef.current.target.distanceTo(desiredTargetRef.current);
      const distPos = camera.position.distanceTo(desiredPosRef.current);

      if (distTarget < 0.2 && distPos < 0.3) {
        isTransitioningRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2.05} // Cegah kamera menembus tanah
      minDistance={15}
      maxDistance={210}
      target={[0, 2, 0]}
      onStart={() => {
        // Hentikan animasi otomatis jika user melakukan interaksi mouse manual
        isTransitioningRef.current = false;
      }}
    />
  );
}

export const TwinCanvas: React.FC<TwinCanvasProps> = ({ floors }) => {
  const { mode, isGrayscale } = useViewStore();

  return (
    <div
      className={`w-full h-full relative z-0 isolate overflow-hidden cursor-grab active:cursor-grabbing bg-[#E5EDF4] transition-all duration-300 ${
        isGrayscale ? "grayscale contrast-105" : ""
      }`}
    >
      <Canvas
        shadows
        camera={{ position: [75, 58, 88], fov: 38 }}
        dpr={[1, 2]}
      >
        {/* World Background bernuansa langit kampus tropis cerah */}
        <color attach="background" args={["#E5EDF4"]} />
        <fog attach="fog" args={["#E5EDF4", 150, 320]} />

        {/* Pencahayaan Lembut Alami */}
        <ambientLight intensity={0.8} />

        {/* Sinar Matahari Utama (Warm Directional Light) */}
        <directionalLight
          position={[55, 80, 45]}
          intensity={1.35}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />

        {/* Cahaya Pengisi Lembut (Cool Sky Fill Light) */}
        <directionalLight position={[-45, 35, -35]} intensity={0.55} color="#E0F2FE" />

        <Suspense fallback={null}>
          <Building3D floors={floors} />
          {mode === "building" && (
            <ContactShadows
              position={[0, -12.18, 0]}
              opacity={0.4}
              scale={120}
              blur={2.2}
              far={18}
            />
          )}
          <Environment preset="city" />
        </Suspense>

        <TwinCameraController floors={floors} />
      </Canvas>
    </div>
  );
};

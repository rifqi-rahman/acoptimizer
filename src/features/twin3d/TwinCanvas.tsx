import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { FloorModel } from "../../building/params";
import { useViewStore } from "../../stores/viewStore";
import { Building3D } from "./Building3D";

interface TwinCanvasProps {
  floors: FloorModel[];
}

// Controller pendeteksi sudut putar kamera untuk kompas
function CameraAzimuthTracker() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const setCameraAzimuth = useViewStore((s) => s.setCameraAzimuth);

  useFrame(() => {
    if (controlsRef.current) {
      // Dapatkan sudut azimuth kamera saat ini
      const azimuth = controlsRef.current.getAzimuthalAngle();
      setCameraAzimuth(azimuth);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2.05} // Cegah kamera menembus tanah
      minDistance={20}
      maxDistance={190}
      target={[0, 4, 0]} // Fokus ke tengah elevasi gedung
    />
  );
}

export const TwinCanvas: React.FC<TwinCanvasProps> = ({ floors }) => {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-[#F4F5F7]">
      <Canvas
        shadows
        camera={{ position: [55, 45, 65], fov: 42 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.8} />
        {/* Soft Warm Directional Light mirip render clay */}
        <directionalLight
          position={[40, 60, 30]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        {/* Soft Cool Fill Light dari sisi berlawanan */}
        <directionalLight position={[-30, 20, -30]} intensity={0.4} color="#E0F2FE" />

        <Suspense fallback={null}>
          <Building3D floors={floors} />
          <ContactShadows
            position={[0, -12.4, 0]}
            opacity={0.3}
            scale={120}
            blur={2.0}
            far={15}
          />
          <Environment preset="city" />
        </Suspense>

        <CameraAzimuthTracker />
      </Canvas>
    </div>
  );
};

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
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-[#D5DFE8]">
      <Canvas
        shadows
        camera={{ position: [75, 58, 88], fov: 40 }}
        dpr={[1, 2]}
      >
        {/* World Background bernuansa studio slate yang lebih kontras terhadap gedung putih */}
        <color attach="background" args={["#D5DFE8"]} />
        <fog attach="fog" args={["#D5DFE8", 140, 300]} />

        <ambientLight intensity={0.9} />
        {/* Soft Warm Directional Light mirip render clay */}
        <directionalLight
          position={[50, 75, 40]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        {/* Soft Cool Fill Light dari sisi berlawanan */}
        <directionalLight position={[-40, 30, -30]} intensity={0.5} color="#E0F2FE" />

        <Suspense fallback={null}>
          <Building3D floors={floors} />
          <ContactShadows
            position={[0, -12.38, 0]}
            opacity={0.45}
            scale={130}
            blur={2.2}
            far={18}
          />
          <Environment preset="city" />
        </Suspense>

        <CameraAzimuthTracker />
      </Canvas>
    </div>
  );
};

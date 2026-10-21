import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { FloorModel } from "../../building/params";
import { useViewStore } from "../../stores/viewStore";
import { Building3D } from "./Building3D";

interface TwinCanvasProps {
  floors: FloorModel[];
}

// Controller pendeteksi sudut putar kamera untuk kompas HUD
function CameraAzimuthTracker() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const setCameraAzimuth = useViewStore((s) => s.setCameraAzimuth);

  useFrame(() => {
    if (controlsRef.current) {
      const azimuth = controlsRef.current.getAzimuthalAngle();
      setCameraAzimuth(azimuth);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2.05} // Cegah kamera menembus tanah
      minDistance={25}
      maxDistance={200}
      target={[0, 4, 0]} // Titik fokus kamera ke tengah gedung
    />
  );
}

export const TwinCanvas: React.FC<TwinCanvasProps> = ({ floors }) => {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing bg-[#0F172A]">
      <Canvas
        shadows
        camera={{ position: [75, 58, 88], fov: 40 }}
        dpr={[1, 1.5]} // Optimal untuk layar Retina tanpa mengorbankan 60 FPS
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          stencil: false,
          depth: true,
        }}
      >
        {/* World Background & Fog bertema Dark Navy Studio (Selaras dengan Palette Biru App) */}
        <color attach="background" args={["#0B132B"]} />
        <fog attach="fog" args={["#0B132B", 130, 280]} />

        {/* Pencahayaan Lembut & Efisien Tanpa Beban RTT */}
        <ambientLight intensity={1.1} />
        <directionalLight
          position={[60, 85, 45]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0003}
        />
        <directionalLight position={[-50, 35, -40]} intensity={0.5} color="#BAE6FD" />

        {/* 1 Bidang Tanah Penuh (Bukan Lingkaran), Biru Gelap Shading Palette Logo dengan Opacity Halus */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -12.4, 0]} receiveShadow>
          <planeGeometry args={[600, 600]} />
          <meshStandardMaterial
            color="#111E38"
            transparent
            opacity={0.88}
            roughness={0.75}
            metalness={0.15}
          />
        </mesh>

        <Suspense fallback={null}>
          <Building3D floors={floors} />
        </Suspense>

        <CameraAzimuthTracker />
      </Canvas>
    </div>
  );
};

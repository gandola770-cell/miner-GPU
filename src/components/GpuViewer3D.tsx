import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GpuDevice, RgbMode } from '../types/miner';
import { playClickSound, playFanRampSound } from '../utils/sound';

interface GpuViewer3DProps {
  device: GpuDevice;
  rgbMode: RgbMode;
  onRgbCycle: () => void;
  onBenchmark?: () => void;
  onFanAggressive?: () => void;
  onTuneVoltage?: () => void;
}

export const GpuViewer3D: React.FC<GpuViewer3DProps> = ({
  device,
  rgbMode,
  onRgbCycle,
  onBenchmark,
  onFanAggressive,
  onTuneVoltage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExploded, setIsExploded] = useState(false);
  const [isThermalView, setIsThermalView] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [inspectedPart, setInspectedPart] = useState<string | null>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // References for dynamic updates inside animation loop
  const fansRef = useRef<THREE.Group[]>([]);
  const ledStripsRef = useRef<THREE.Mesh[]>([]);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const explodedFactorRef = useRef(0);
  const targetExplodedFactorRef = useRef(0);
  const thermalFactorRef = useRef(0);
  const targetThermalFactorRef = useRef(0);
  const materialsRef = useRef<{
    shroud: THREE.MeshPhongMaterial;
    metal: THREE.MeshPhongMaterial;
    copper: THREE.MeshPhongMaterial;
    pcb: THREE.MeshPhongMaterial;
    fanBlade: THREE.MeshPhongMaterial;
  } | null>(null);

  // User drag rotation state
  const rotationState = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: 0.45,
    rotY: -0.55,
    targetRotX: 0.45,
    targetRotY: -0.55,
    zoom: 38,
    targetZoom: 38,
  });

  // Keep exploded target updated
  useEffect(() => {
    targetExplodedFactorRef.current = isExploded ? 1 : 0;
  }, [isExploded]);

  // Keep thermal target updated
  useEffect(() => {
    targetThermalFactorRef.current = isThermalView ? 1 : 0;
  }, [isThermalView]);

  // Handle RGB mode color changes
  useEffect(() => {
    if (!pointLightRef.current || ledStripsRef.current.length === 0) return;
    let hex = 0x00f0ff;
    if (rgbMode === 'emerald') hex = 0x00fe66;
    else if (rgbMode === 'amber') hex = 0xffb703;
    else if (rgbMode === 'purple') hex = 0xa855f7;
    else if (rgbMode === 'off') hex = 0x222222;

    if (rgbMode !== 'rainbow') {
      pointLightRef.current.color.setHex(hex);
      ledStripsRef.current.forEach((mesh) => {
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(hex);
      });
    }
  }, [rgbMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 15, rotationState.current.zoom);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.2);
    dirLight1.position.set(25, 30, 25);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00fe66, 1.8);
    dirLight2.position.set(-25, -15, -25);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x00f0ff, 3.2, 60);
    pointLight.position.set(0, 4, 12);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    // Master GPU Rig Group
    const gpuMasterGroup = new THREE.Group();
    scene.add(gpuMasterGroup);

    // Subgroups for Exploded View animation
    const pcbGroup = new THREE.Group();
    const heatsinkMasterGroup = new THREE.Group();
    const shroudGroup = new THREE.Group();
    const fansMasterGroup = new THREE.Group();

    gpuMasterGroup.add(pcbGroup);
    gpuMasterGroup.add(heatsinkMasterGroup);
    gpuMasterGroup.add(shroudGroup);
    gpuMasterGroup.add(fansMasterGroup);

    // Standard materials
    const shroudMat = new THREE.MeshPhongMaterial({ color: 0x121722, specular: 0x3b495b, shininess: 45 });
    const metalMat = new THREE.MeshPhongMaterial({ color: 0x242d3d, specular: 0xa0b1c9, shininess: 85 });
    const copperMat = new THREE.MeshPhongMaterial({ color: 0xca8a04, specular: 0xfef08a, shininess: 110 });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const limeGlowMat = new THREE.MeshBasicMaterial({ color: 0x00fe66 });
    const fanBladeMat = new THREE.MeshPhongMaterial({ color: 0x0b1019, specular: 0x475569, shininess: 35 });
    const pcbMat = new THREE.MeshPhongMaterial({ color: 0x042f2e, specular: 0x0f766e, shininess: 25 });
    const goldMat = new THREE.MeshPhongMaterial({ color: 0xeab308, specular: 0xffffff, shininess: 95 });

    materialsRef.current = {
      shroud: shroudMat,
      metal: metalMat,
      copper: copperMat,
      pcb: pcbMat,
      fanBlade: fanBladeMat,
    };

    // 1. PCB Backplate & Components
    const pcbGeo = new THREE.BoxGeometry(28, 0.6, 12);
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.position.set(0, -0.3, 0);
    pcbGroup.add(pcb);

    // Gold PCIe connector
    const pcieGeo = new THREE.BoxGeometry(14, 0.4, 1.2);
    const pcie = new THREE.Mesh(pcieGeo, goldMat);
    pcie.position.set(-2, -0.7, 5.8);
    pcbGroup.add(pcie);

    // GPU Silicon Die Core on PCB
    const dieGeo = new THREE.BoxGeometry(3.6, 0.35, 3.6);
    const dieMat = new THREE.MeshPhongMaterial({ color: 0x22d3ee, specular: 0xffffff, shininess: 120 });
    const dieMesh = new THREE.Mesh(dieGeo, dieMat);
    dieMesh.position.set(0, 0.15, 0);
    pcbGroup.add(dieMesh);

    // GDDR6X VRAM memory chip modules (surrounding the die)
    const vramMat = new THREE.MeshPhongMaterial({ color: 0x0f172a, specular: 0x64748b, shininess: 50 });
    const vramCoords = [
      [-3.2, 0.15, -2.5],
      [-3.2, 0.15, 0],
      [-3.2, 0.15, 2.5],
      [3.2, 0.15, -2.5],
      [3.2, 0.15, 0],
      [3.2, 0.15, 2.5],
      [-1.4, 0.15, 3.2],
      [1.4, 0.15, 3.2],
      [-1.4, 0.15, -3.2],
      [1.4, 0.15, -3.2],
    ];
    vramCoords.forEach(([x, y, z]) => {
      const vramGeo = new THREE.BoxGeometry(1.4, 0.25, 1.4);
      const vramMesh = new THREE.Mesh(vramGeo, vramMat);
      vramMesh.position.set(x, y, z);
      pcbGroup.add(vramMesh);
    });

    // 2. Heatsink Aluminum Fin Array
    for (let i = -12.5; i <= 12.5; i += 0.8) {
      const finGeo = new THREE.BoxGeometry(0.22, 4.2, 10.6);
      const fin = new THREE.Mesh(finGeo, metalMat);
      fin.position.set(i, 2.2, 0);
      heatsinkMasterGroup.add(fin);
    }

    // 3. Copper Heatpipes through fins
    const pipeGeo = new THREE.CylinderGeometry(0.42, 0.42, 25.5, 16);
    const pipe1 = new THREE.Mesh(pipeGeo, copperMat);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(0, 1.8, 2.6);
    heatsinkMasterGroup.add(pipe1);

    const pipe2 = pipe1.clone();
    pipe2.position.set(0, 1.8, -2.6);
    heatsinkMasterGroup.add(pipe2);

    const pipe3 = pipe1.clone();
    pipe3.position.set(0, 3.2, 0);
    heatsinkMasterGroup.add(pipe3);

    // 4. Shroud Frames & LED Accents
    const topRailGeo = new THREE.BoxGeometry(28.4, 0.6, 1.2);
    const topRail1 = new THREE.Mesh(topRailGeo, shroudMat);
    topRail1.position.set(0, 4.4, 5.2);
    shroudGroup.add(topRail1);

    const topRail2 = new THREE.Mesh(topRailGeo, shroudMat);
    topRail2.position.set(0, 4.4, -5.2);
    shroudGroup.add(topRail2);

    // Side brackets
    const bracketGeo = new THREE.BoxGeometry(0.8, 5, 11.6);
    const bracketLeft = new THREE.Mesh(bracketGeo, metalMat);
    bracketLeft.position.set(-14.2, 2.3, 0);
    shroudGroup.add(bracketLeft);

    const bracketRight = new THREE.Mesh(bracketGeo, shroudMat);
    bracketRight.position.set(14.2, 2.3, 0);
    shroudGroup.add(bracketRight);

    // RGB LED Accent Strips
    const ledGeo = new THREE.BoxGeometry(26, 0.22, 0.4);
    const ledStrip1 = new THREE.Mesh(ledGeo, cyanGlowMat);
    ledStrip1.position.set(0, 4.5, 4.8);
    shroudGroup.add(ledStrip1);

    const ledStrip2 = new THREE.Mesh(ledGeo, limeGlowMat);
    ledStrip2.position.set(0, 4.5, -4.8);
    shroudGroup.add(ledStrip2);

    ledStripsRef.current = [ledStrip1, ledStrip2];

    // IO Ports on left bracket
    for (let p = -3; p <= 3; p += 3) {
      const portGeo = new THREE.BoxGeometry(0.4, 1.2, 2.2);
      const port = new THREE.Mesh(portGeo, cyanGlowMat);
      port.position.set(-14.5, 2.5, p);
      shroudGroup.add(port);
    }

    // 12VHPWR Power connector header
    const powerGeo = new THREE.BoxGeometry(3.6, 1.6, 2.4);
    const powerHeader = new THREE.Mesh(powerGeo, shroudMat);
    powerHeader.position.set(12, 4.8, -4);
    shroudGroup.add(powerHeader);

    // 5. Dual Axial Cooling Fans
    const fanBladesList: THREE.Group[] = [];

    const createFanAssembly = (xOffset: number) => {
      const fanGroup = new THREE.Group();
      fanGroup.position.set(xOffset, 4.3, 0);

      // Fan ring bezel
      const ringGeo = new THREE.TorusGeometry(4.4, 0.25, 8, 36);
      const ring = new THREE.Mesh(ringGeo, cyanGlowMat);
      ring.rotation.x = Math.PI / 2;
      fanGroup.add(ring);

      // Center Hub
      const hubGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.8, 24);
      const hub = new THREE.Mesh(hubGeo, metalMat);
      fanGroup.add(hub);

      // Center Badge
      const badgeGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.9, 20);
      const badge = new THREE.Mesh(badgeGeo, cyanGlowMat);
      fanGroup.add(badge);

      // 9 fan blades with pitch
      const bladeAssembly = new THREE.Group();
      for (let b = 0; b < 9; b++) {
        const angle = (b / 9) * Math.PI * 2;
        const bladeGeo = new THREE.BoxGeometry(0.3, 0.16, 3.2);
        const blade = new THREE.Mesh(bladeGeo, fanBladeMat);
        blade.position.set(Math.cos(angle) * 2.2, 0, Math.sin(angle) * 2.2);
        blade.rotation.y = -angle;
        blade.rotation.x = 0.45;
        bladeAssembly.add(blade);
      }
      fanGroup.add(bladeAssembly);
      fanBladesList.push(bladeAssembly);

      fansMasterGroup.add(fanGroup);
    };

    createFanAssembly(-7);
    createFanAssembly(7);
    fansRef.current = fanBladesList;

    // Interactive Drag / Orbit Handlers
    const dom = renderer.domElement;
    dom.style.cursor = 'grab';

    const onMouseDown = (e: MouseEvent) => {
      rotationState.current.isDragging = true;
      dom.style.cursor = 'grabbing';
      rotationState.current.prevX = e.clientX;
      rotationState.current.prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!rotationState.current.isDragging) return;
      const dx = e.clientX - rotationState.current.prevX;
      const dy = e.clientY - rotationState.current.prevY;
      rotationState.current.targetRotY += dx * 0.009;
      rotationState.current.targetRotX += dy * 0.009;
      rotationState.current.targetRotX = Math.max(-1.15, Math.min(1.15, rotationState.current.targetRotX));
      rotationState.current.prevX = e.clientX;
      rotationState.current.prevY = e.clientY;
    };

    const onMouseUp = () => {
      rotationState.current.isDragging = false;
      dom.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      rotationState.current.targetZoom += e.deltaY * 0.03;
      rotationState.current.targetZoom = Math.max(22, Math.min(55, rotationState.current.targetZoom));
    };

    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        rotationState.current.isDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (rotationState.current.isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        rotationState.current.targetRotY += dx * 0.012;
        rotationState.current.targetRotX += dy * 0.012;
        rotationState.current.targetRotX = Math.max(-1.15, Math.min(1.15, rotationState.current.targetRotX));
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = () => {
      rotationState.current.isDragging = false;
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth || 800;
      const nh = container.clientHeight || 400;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Fan blade rotation based on card's fan speed
      const fanSpeedFactor = (device.fanSpeedPercent / 100) * 0.32 + 0.08;
      fansRef.current.forEach((bladeAssembly) => {
        bladeAssembly.rotation.y += fanSpeedFactor;
      });

      // Rainbow RGB Cycle
      if (rgbMode === 'rainbow' && pointLightRef.current) {
        const hue = (time * 0.15) % 1;
        const color = new THREE.Color().setHSL(hue, 1.0, 0.5);
        pointLightRef.current.color.copy(color);
        ledStripsRef.current.forEach((mesh) => {
          (mesh.material as THREE.MeshBasicMaterial).color.copy(color);
        });
      }

      // Smooth exploded view interpolation
      explodedFactorRef.current += (targetExplodedFactorRef.current - explodedFactorRef.current) * 0.08;
      const ef = explodedFactorRef.current;

      pcbGroup.position.y = -ef * 3.5;
      heatsinkMasterGroup.position.y = 0;
      shroudGroup.position.y = ef * 3.2;
      fansMasterGroup.position.y = ef * 5.2;

      // Smooth thermal mode color transition
      thermalFactorRef.current += (targetThermalFactorRef.current - thermalFactorRef.current) * 0.08;
      const tf = thermalFactorRef.current;

      if (materialsRef.current) {
        if (tf > 0.01) {
          // Heatmap: PCB to deep blue/cyan, Heatsink to warm gold/orange, Die/shroud to glowing amber
          materialsRef.current.pcb.color.setHex(0x0a2540);
          materialsRef.current.metal.color.setHex(0xd97706);
          materialsRef.current.shroud.color.setHex(0xef4444);
        } else {
          materialsRef.current.pcb.color.setHex(0x042f2e);
          materialsRef.current.metal.color.setHex(0x242d3d);
          materialsRef.current.shroud.color.setHex(0x121722);
        }
      }

      // Smooth camera zoom
      rotationState.current.zoom += (rotationState.current.targetZoom - rotationState.current.zoom) * 0.1;
      camera.position.z = rotationState.current.zoom;

      // Auto turntable rotation when not dragging
      if (isAutoRotate && !rotationState.current.isDragging) {
        rotationState.current.targetRotY += 0.0035;
      }

      // Smooth rotational damping
      rotationState.current.rotY += (rotationState.current.targetRotY - rotationState.current.rotY) * 0.08;
      rotationState.current.rotX += (rotationState.current.targetRotX - rotationState.current.rotX) * 0.08;

      gpuMasterGroup.rotation.y = rotationState.current.rotY;
      gpuMasterGroup.rotation.x = rotationState.current.rotX;

      // Floating bob motion
      gpuMasterGroup.position.y = Math.sin(time * 1.6) * 0.5;

      // Dynamic breathing light
      if (pointLightRef.current) {
        pointLightRef.current.intensity = 2.6 + Math.sin(time * 2.8) * 0.6;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [device.fanSpeedPercent, isAutoRotate, rgbMode]);

  const resetView = () => {
    playClickSound();
    rotationState.current.targetRotX = 0.45;
    rotationState.current.targetRotY = -0.55;
    rotationState.current.targetZoom = 38;
    setIsExploded(false);
    setIsThermalView(false);
    setInspectedPart(null);
  };

  const toggleExploded = () => {
    playFanRampSound();
    setIsExploded(!isExploded);
  };

  const toggleThermal = () => {
    playClickSound();
    setIsThermalView(!isThermalView);
  };

  return (
    <div className="rounded-xl bg-[#141923] p-5 flex flex-col gap-4 shadow-2xl relative border border-[#232b3b]">
      {/* Top ambient glow bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-80" />

      {/* Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs text-[#00f0ff] font-mono tracking-wider font-semibold">
              NODE 01 TELEMETRY FEED
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1b2230] text-[#00fe66] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00fe66] animate-ping" />
              MINING STABLE
            </div>
            <span className="px-2 py-0.5 rounded bg-[#1b2230] text-[#849495] text-xs font-mono">
              {device.pcieSlot}
            </span>
          </div>
          <h2 className="text-lg md:text-xl text-[#e1e2ec] font-bold tracking-tight font-display">
            GPU 01: {device.name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#849495]">
            SERIAL: <span className="font-mono text-[#e1e2ec]">{device.serialNumber}</span>
          </span>
          <span className="px-2 py-1 rounded bg-[#202736] text-xs text-[#00f0ff] font-mono">
            VBIOS: {device.vbios}
          </span>
        </div>
      </div>

      {/* 3D Model Embedded Viewport with HUD Overlays */}
      <div className="relative w-full rounded-xl overflow-hidden bg-[#07090e] border border-[#00f0ff]/25 shadow-2xl min-h-[340px] md:min-h-[380px]">
        {webGlSupported ? (
          <div ref={containerRef} className="w-full h-80 md:h-96" />
        ) : (
          <div className="w-full h-80 md:h-96 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#10131a] to-[#1d1f27]">
            <span className="material-symbols-outlined text-4xl text-[#00f0ff] mb-2">memory</span>
            <p className="text-sm font-bold text-white mb-1">WebGL Hardware Accelerated View</p>
            <p className="text-xs text-[#849495] max-w-md">
              Interactive 3D model paused. Live telemetry feeds continue updating below.
            </p>
          </div>
        )}

        {/* Top-Center Drag Prompt & View Controls */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto px-3 py-1 rounded-full bg-[#0b0e15]/80 backdrop-blur-md flex items-center gap-2 shadow-md border border-white/10">
          <span className="material-symbols-outlined text-[14px] text-[#00f0ff]">3d_rotation</span>
          <span className="text-xs text-[#e1e2ec] font-mono tracking-wider hidden sm:inline">
            Drag to rotate // Scroll to zoom
          </span>
          <span className="text-xs text-[#e1e2ec] font-mono tracking-wider sm:hidden">
            Drag 3D
          </span>
          <button
            onClick={() => {
              playClickSound();
              setIsAutoRotate(!isAutoRotate);
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              isAutoRotate ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'bg-white/10 text-slate-400'
            }`}
            title="Toggle turntable auto-rotation"
          >
            AUTO
          </button>
          <button
            onClick={resetView}
            className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Reset 3D camera angle"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
          </button>
        </div>

        {/* Top-Left Live Thermal & Clock Glass HUD */}
        <div className="absolute top-4 left-4 p-3 rounded-lg bg-[#07090e]/85 backdrop-blur-xl shadow-lg flex flex-col gap-2 max-w-[210px] border border-white/10 pointer-events-auto">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#849495] uppercase font-mono tracking-wider">
              CORE DIE TEMP
            </span>
            <span className="text-[10px] text-[#00fe66] font-mono font-bold">
              {device.coreTemp < 65 ? 'SAFE' : device.coreTemp < 78 ? 'WARM' : 'HOT'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl text-[#00f0ff] font-bold font-mono">
              {device.coreTemp}°C
            </span>
            <span className="text-[10px] text-[#849495] font-mono">/ TARGET 65°C</span>
          </div>
          <div className="w-full bg-[#1b2230] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#00f0ff] via-[#00fe66] to-[#ffb703] h-full transition-all duration-500"
              style={{ width: `${Math.min(100, (device.coreTemp / 85) * 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1 text-[#849495] text-[10px] font-mono">
            <div>
              VRAM: <span className="text-white font-bold">{device.vramTemp}°C</span>
            </div>
            <div>
              HOTSPOT: <span className="text-white font-bold">{device.hotspotTemp}°C</span>
            </div>
          </div>
        </div>

        {/* Top-Right Live Frequency & Clocks HUD */}
        <div className="absolute top-4 right-4 p-3 rounded-lg bg-[#07090e]/85 backdrop-blur-xl shadow-lg flex flex-col gap-2 max-w-[210px] border border-white/10 pointer-events-auto">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#849495] uppercase font-mono tracking-wider">
              DYNAMIC CLOCKS
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#00f0ff]">speed</span>
          </div>
          <div className="flex flex-col gap-1 text-xs font-mono">
            <div className="flex justify-between items-baseline">
              <span className="text-[#849495] text-[11px]">CORE:</span>
              <span className="text-[#00f0ff] font-bold">
                {device.coreClockMhz.toLocaleString()} MHz
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[#849495] text-[11px]">MEM:</span>
              <span className="text-[#00fe66] font-bold">
                {device.memClockMhz.toLocaleString()} MHz
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[#849495] text-[11px]">VOLT:</span>
              <span className="text-white font-bold">{device.voltageV.toFixed(3)} V</span>
            </div>
          </div>
        </div>

        {/* Bottom-Left Fan Tachometer HUD */}
        <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-[#07090e]/85 backdrop-blur-xl shadow-lg flex items-center gap-3 border border-white/10 pointer-events-auto">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#1b2230]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-[#00f0ff] transition-all duration-300"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${device.fanSpeedPercent}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
            <span
              className="material-symbols-outlined text-[16px] text-[#00f0ff] absolute"
              style={{
                animation: `spin ${Math.max(0.4, 2.5 - (device.fanSpeedPercent / 100) * 2)}s linear infinite`,
              }}
            >
              mode_fan
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#849495] uppercase font-mono">AXIAL FAN ARRAY</span>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-sm font-bold text-white">{device.fanRpm} RPM</span>
              <span className="text-xs text-[#00f0ff] font-bold">({device.fanSpeedPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Bottom-Right Power & Efficiency Gauge HUD */}
        <div className="absolute bottom-4 right-4 p-3 rounded-lg bg-[#07090e]/85 backdrop-blur-xl shadow-lg flex items-center gap-3 border border-white/10 pointer-events-auto">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#849495] uppercase font-mono">
              POWER RAIL (TDP {device.tdpWatts}W)
            </span>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-sm font-bold text-white">{device.powerDrawWatts} W</span>
              <span className="text-xs text-[#00fe66]">
                EFF: {(device.hashrate / device.powerDrawWatts).toFixed(3)} MH/W
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded bg-[#1b2230] flex items-center justify-center text-[#00f0ff]">
            <span className="material-symbols-outlined text-[18px]">power</span>
          </div>
        </div>

        {/* Floating Part Inspector Tag if selected */}
        {inspectedPart && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-[#0e1420]/90 backdrop-blur-md border border-[#00f0ff]/40 shadow-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#00f0ff]">info</span>
            <span className="text-xs font-mono text-white">{inspectedPart}</span>
            <button
              onClick={() => setInspectedPart(null)}
              className="text-[#849495] hover:text-white text-xs ml-1"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Quick Action Controls Toolbar under 3D Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
        <button
          onClick={toggleExploded}
          className={`px-3 py-2 rounded transition-all flex items-center justify-center gap-2 text-xs font-mono font-medium ${
            isExploded
              ? 'bg-[#00f0ff] text-[#002022] font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-[#1a212e] text-[#e1e2ec] hover:bg-[#232b3b]'
          }`}
          title="Spread components apart along Y-axis"
        >
          <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
          <span>{isExploded ? 'Collapse' : 'Exploded View'}</span>
        </button>

        <button
          onClick={toggleThermal}
          className={`px-3 py-2 rounded transition-all flex items-center justify-center gap-2 text-xs font-mono font-medium ${
            isThermalView
              ? 'bg-[#ef4444] text-white font-bold shadow-[0_0_12px_rgba(239,68,68,0.4)]'
              : 'bg-[#1a212e] text-[#e1e2ec] hover:bg-[#232b3b]'
          }`}
          title="Toggle Thermal Heatmap Shader"
        >
          <span className="material-symbols-outlined text-[16px]">thermostat</span>
          <span>{isThermalView ? 'Physical View' : 'Thermal Heatmap'}</span>
        </button>

        <button
          onClick={() => {
            playClickSound();
            onRgbCycle();
          }}
          className="px-3 py-2 rounded bg-[#1a212e] hover:bg-[#232b3b] text-[#e1e2ec] transition-all flex items-center justify-center gap-2 text-xs font-mono font-medium"
          title="Cycle GPU chassis RGB illumination"
        >
          <span className="material-symbols-outlined text-[#00f0ff] text-[16px]">palette</span>
          <span>RGB: {rgbMode.toUpperCase()}</span>
        </button>

        <button
          onClick={onFanAggressive}
          className="px-3 py-2 rounded bg-[#1a212e] hover:bg-[#232b3b] text-[#e1e2ec] transition-all flex items-center justify-center gap-2 text-xs font-mono font-medium group"
          title="Engage 100% cooling fan turbo ramp"
        >
          <span className="material-symbols-outlined text-[#00fe66] text-[16px] group-hover:scale-110 transition-transform">
            cyclone
          </span>
          <span>Fan Turbo Curve</span>
        </button>

        <button
          onClick={onBenchmark}
          className="px-3 py-2 rounded bg-[#1a212e] hover:bg-[#232b3b] text-[#e1e2ec] transition-all flex items-center justify-center gap-2 text-xs font-mono font-medium group"
          title="Run quick 10-second compute stress benchmark"
        >
          <span className="material-symbols-outlined text-[#00f0ff] text-[16px] group-hover:rotate-45 transition-transform">
            equalizer
          </span>
          <span>Benchmark Core</span>
        </button>

        <button
          onClick={onTuneVoltage}
          className="px-3 py-2 rounded bg-[#1a212e] hover:bg-[#232b3b] text-[#e1e2ec] transition-all flex items-center justify-center gap-2 text-xs font-mono font-medium group"
          title="Open voltage and clock curve calibrator"
        >
          <span className="material-symbols-outlined text-[#ffb703] text-[16px] group-hover:rotate-45 transition-transform">
            tune
          </span>
          <span>Tune V-Curve</span>
        </button>
      </div>
    </div>
  );
};

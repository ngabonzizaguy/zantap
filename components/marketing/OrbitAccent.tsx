"use client";

import { useEffect, useRef } from "react";

/**
 * Restrained Three.js accent (ADR-0047; prototype B's orbit lines are the
 * taste reference): three faint amber elliptical orbits slowly precessing
 * behind the device stage. Accent, not centerpiece. `three` is loaded lazily
 * inside the effect so it never enters the initial bundle; skipped entirely
 * under prefers-reduced-motion.
 */
export function OrbitAccent() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const THREE = await import("three");
      if (disposed || !hostRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.z = 6;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "0";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      host.appendChild(renderer.domElement);

      const orbits: InstanceType<typeof THREE.LineLoop>[] = [];
      const orbitConfigs = [
        { radiusX: 2.6, radiusY: 1.05, tilt: 0.45, opacity: 0.32 },
        { radiusX: 2.2, radiusY: 1.35, tilt: -0.6, opacity: 0.22 },
        { radiusX: 2.9, radiusY: 0.85, tilt: 0.15, opacity: 0.16 },
      ];
      for (const config of orbitConfigs) {
        const curve = new THREE.EllipseCurve(
          0,
          0,
          config.radiusX,
          config.radiusY,
          0,
          Math.PI * 2
        );
        const points = curve.getPoints(120);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0xf5a623,
          transparent: true,
          opacity: config.opacity,
        });
        const orbit = new THREE.LineLoop(geometry, material);
        orbit.rotation.x = Math.PI / 2.4;
        orbit.rotation.z = config.tilt;
        scene.add(orbit);
        orbits.push(orbit);
      }

      function resize() {
        const { clientWidth, clientHeight } = host!;
        if (clientWidth === 0 || clientHeight === 0) return;
        renderer.setSize(clientWidth, clientHeight, false);
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
      }
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);

      let frame = 0;
      function tick(time: number) {
        orbits.forEach((orbit, index) => {
          orbit.rotation.z += 0.0006 * (index + 1);
          orbit.rotation.y = Math.sin(time / 9000 + index) * 0.12;
        });
        renderer.render(scene, camera);
        frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        for (const orbit of orbits) {
          orbit.geometry.dispose();
          (orbit.material as { dispose: () => void }).dispose();
        }
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    />
  );
}

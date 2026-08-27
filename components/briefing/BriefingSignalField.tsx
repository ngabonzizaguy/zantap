"use client";

import { useEffect, useRef } from "react";

export function BriefingSignalField() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    let disposed = false;
    let cleanup: (() => void) | undefined;
    void (async () => {
      const THREE = await import("three");
      if (disposed || !hostRef.current) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
      camera.position.z = 5.5;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.domElement.className = "briefing-signal-canvas";
      host.appendChild(renderer.domElement);

      const count = 110;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const radius = 1.1 + Math.random() * 2.2;
        const angle = Math.random() * Math.PI * 2;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3.8;
        positions[i * 3 + 2] = Math.sin(angle) * 0.8 + (Math.random() - 0.5);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: 0xf5a623,
        size: 0.025,
        transparent: true,
        opacity: 0.5,
        sizeAttenuation: true,
      });
      const field = new THREE.Points(geometry, material);
      field.rotation.x = -0.18;
      scene.add(field);

      const ringGeometry = new THREE.TorusGeometry(1.9, 0.006, 8, 160);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xf5a623,
        transparent: true,
        opacity: 0.18,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = 1.1;
      ring.rotation.y = 0.45;
      scene.add(ring);

      const resize = () => {
        if (!host.clientWidth || !host.clientHeight) return;
        renderer.setSize(host.clientWidth, host.clientHeight, false);
        camera.aspect = host.clientWidth / host.clientHeight;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();

      let frame = 0;
      const tick = (time: number) => {
        field.rotation.y = time * 0.000025;
        ring.rotation.z = time * 0.000035;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        geometry.dispose();
        material.dispose();
        ringGeometry.dispose();
        ringMaterial.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={hostRef} className="briefing-signal" aria-hidden />;
}

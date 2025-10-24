import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Advanced Voice Reactive Sphere Component
 * Features:
 * - Face-like depth mapping with gradual density
 * - Black center with gradient to lighter edges
 * - Voice sensitivity with dramatic reactions
 * - Mouse interactivity
 * - Organic deformation with spikes
 *
 * Props:
 * - isListening: boolean - whether voice input is active
 * - audioLevel: number (0-1) - current audio level from microphone
 */
export default function VoiceReactiveSphere({ isListening = false, audioLevel = 0 }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const particlesRef = useRef(null);
  const animationIdRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Use refs to store latest prop values for animation loop
  const audioLevelRef = useRef(audioLevel);
  const isListeningRef = useRef(isListening);

  // Update refs when props change
  useEffect(() => {
    audioLevelRef.current = audioLevel;
    isListeningRef.current = isListening;

    // Log audio level changes for debugging
    if (audioLevel > 0.1) {
      console.log('🎵 Audio level:', audioLevel.toFixed(3));
    }
  }, [audioLevel, isListening]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 250;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create particle sphere with face pattern and gradual density
    const particleCount = 5000; // Reduced for more space between points
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Function to create face depth map (subtle face features)
    const getFaceDepth = (x, y, z) => {
      const nx = x / 100;
      const ny = y / 100;
      const nz = z / 100;

      // Create subtle face features
      const eyeLeft = Math.exp(-((nx + 0.3) ** 2 + (ny - 0.2) ** 2) / 0.02);
      const eyeRight = Math.exp(-((nx - 0.3) ** 2 + (ny - 0.2) ** 2) / 0.02);
      const nose = Math.exp(-(nx ** 2 + (ny) ** 2) / 0.015) * 0.5;
      const mouth = Math.exp(-(nx ** 2 + (ny + 0.3) ** 2) / 0.03) * 0.3;

      return (eyeLeft + eyeRight + nose + mouth) * 15;
    };

    // Create sphere with gradual density - sparse outside, dense inside
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Create density layers - closer to center = more likely to place particle
      const densityRandom = Math.random();
      let radiusMultiplier;

      if (densityRandom < 0.15) {
        // Outer sparse layer - einzelne points
        radiusMultiplier = 1.3 + Math.random() * 0.4;
      } else if (densityRandom < 0.35) {
        // Middle layer - wird dichter
        radiusMultiplier = 1.1 + Math.random() * 0.2;
      } else {
        // Inner dense core - am dichtesten
        radiusMultiplier = 0.7 + Math.random() * 0.4;
      }

      const baseRadius = 85;
      const radius = baseRadius * radiusMultiplier + Math.random() * 15;

      const baseX = Math.sin(phi) * Math.cos(theta);
      const baseY = Math.sin(phi) * Math.sin(theta);
      const baseZ = Math.cos(phi);

      // Organic deformation
      const organicNoise = Math.sin(theta * 3) * Math.cos(phi * 2) * 8;

      // Points die rumspicken - random spikes
      const spikeChance = Math.random();
      const spike = spikeChance < 0.08 ? Math.random() * 25 : 0;

      // Add face depth
      const faceDepth = getFaceDepth(baseX * 100, baseY * 100, baseZ * 100);
      const finalRadius = radius + organicNoise + spike - faceDepth;

      positions[i * 3] = finalRadius * baseX;
      positions[i * 3 + 1] = finalRadius * baseY;
      positions[i * 3 + 2] = finalRadius * baseZ;

      originalPositions[i * 3] = positions[i * 3];
      originalPositions[i * 3 + 1] = positions[i * 3 + 1];
      originalPositions[i * 3 + 2] = positions[i * 3 + 2];

      // Modern gradient colors - BLACK in center, lighter outside
      const distanceFromCenter = Math.sqrt(baseX ** 2 + baseY ** 2 + baseZ ** 2);
      // Use radiusMultiplier: smaller = closer to center = darker
      const baseGray = radiusMultiplier < 1.0 ? 0 : (radiusMultiplier - 0.7) * 0.6;
      const colorVariation = Math.random() * 0.15;

      colors[i * 3] = baseGray + colorVariation;
      colors[i * 3 + 1] = baseGray + colorVariation;
      colors[i * 3 + 2] = baseGray + colorVariation * 1.1;

      // Variable sizes - outer points slightly smaller
      sizes[i] = (1.5 + Math.random() * 2) * (radiusMultiplier > 1.2 ? 0.8 : 1);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2.5,
      transparent: true,
      opacity: 0.85,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = {
      mesh: particles,
      originalPositions,
      positions: geometry.attributes.position.array
    };

    // Animation
    let time = 0;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.003;

      // Use REF values to get latest audioLevel from props
      const currentAudioLevel = isListeningRef.current ? audioLevelRef.current : 0;

      const positions = geometry.attributes.position.array;
      const sizesAttr = geometry.attributes.size.array;
      const origPos = originalPositions;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        const distance = Math.sqrt(
          origPos[i3] ** 2 +
          origPos[i3 + 1] ** 2 +
          origPos[i3 + 2] ** 2
        );

        const wave = Math.sin(time * 2 + distance * 0.03) * 2;
        const wave2 = Math.cos(time * 1.5 + distance * 0.02) * 1.5;

        // Audio reactive scaling - MUCH MORE SENSITIVE (increased multiplier)
        const audioScale = 1 + currentAudioLevel * 1.5;
        const audioPulse = Math.sin(time * 10) * currentAudioLevel * 10;

        const mouseInfluence = 0.3;
        const mouseX = mouseRef.current.x * mouseInfluence;
        const mouseY = mouseRef.current.y * mouseInfluence;

        const scale = audioScale + wave / distance * 2;
        positions[i3] = origPos[i3] * scale + wave2 * (origPos[i3] / distance) + mouseX * (origPos[i3] / distance) * 10;
        positions[i3 + 1] = origPos[i3 + 1] * scale + wave2 * (origPos[i3 + 1] / distance) + mouseY * (origPos[i3 + 1] / distance) * 10;
        positions[i3 + 2] = origPos[i3 + 2] * scale + wave * (origPos[i3 + 2] / distance) + audioPulse;

        // Size variation based on audio
        sizesAttr[i] = (1.5 + Math.random() * 2) * (1 + currentAudioLevel * 1.2);
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;

      particles.rotation.y = time * 0.15 + mouseRef.current.x * 0.5;
      particles.rotation.x = Math.sin(time * 0.2) * 0.15 + mouseRef.current.y * 0.3;
      particles.rotation.z = Math.cos(time * 0.1) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    const handleMouseMove = (event) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((event.clientY - rect.top) / rect.height) * 2 + 1
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}

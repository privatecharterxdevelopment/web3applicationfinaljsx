import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Voice Reactive Sphere - connects to external audio source (Hume AI)
 * Props:
 * - isListening: boolean - whether voice input is active
 * - audioLevel: number (0-1) - current audio level from microphone
 */
export default function VoiceReactiveSphere({ isListening = false, audioLevel = 0 }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const particlesRef = useRef(null);
  const animationIdRef = useRef(null);

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
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create particle sphere with MORE particles for better visual
    const particleCount = 12000;
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Create deformed sphere shape - BIGGER radius
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // BIGGER base radius for larger sphere
      const radius = 120 + Math.random() * 30;

      // Add noise for deformation
      const noise = Math.sin(theta * 3) * Math.cos(phi * 2) * 15;
      const finalRadius = radius + noise;

      positions[i * 3] = finalRadius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = finalRadius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = finalRadius * Math.cos(phi);

      // Store original positions
      originalPositions[i * 3] = positions[i * 3];
      originalPositions[i * 3 + 1] = positions[i * 3 + 1];
      originalPositions[i * 3 + 2] = positions[i * 3 + 2];

      // Assign random grayscale colors (black to gray)
      const grayValue = Math.random() * 0.6;
      colors[i * 3] = grayValue;     // R
      colors[i * 3 + 1] = grayValue; // G
      colors[i * 3 + 2] = grayValue; // B
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.0, // Slightly larger particles
      transparent: true,
      opacity: 0.85,
      vertexColors: true
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
      time += 0.005;

      // Use REF values to get latest audioLevel from props
      const currentAudioLevel = isListeningRef.current ? audioLevelRef.current : 0;

      // Update particle positions
      const positions = geometry.attributes.position.array;
      const origPos = originalPositions;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Calculate distance from center
        const distance = Math.sqrt(
          origPos[i3] ** 2 +
          origPos[i3 + 1] ** 2 +
          origPos[i3 + 2] ** 2
        );

        // Base wave animation
        const wave = Math.sin(time + distance * 0.02) * 4;

        // Audio reactive scaling - MUCH MORE SENSITIVE (increased multiplier)
        const audioScale = 1 + currentAudioLevel * 2.5;

        // Apply transformations
        positions[i3] = origPos[i3] * audioScale + wave * (origPos[i3] / distance);
        positions[i3 + 1] = origPos[i3 + 1] * audioScale + wave * (origPos[i3 + 1] / distance);
        positions[i3 + 2] = origPos[i3 + 2] * audioScale + wave * (origPos[i3 + 2] / distance);
      }

      geometry.attributes.position.needsUpdate = true;

      // Rotate the sphere
      particles.rotation.y = time * 0.2;
      particles.rotation.x = Math.sin(time * 0.3) * 0.2;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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

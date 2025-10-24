import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function VoiceReactiveSphere() {
  const containerRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sceneRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    // No background color - transparent
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

    // Create particle sphere
    const particleCount = 8000;
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Create deformed sphere shape
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Base radius with some randomness for organic shape
      const radius = 80 + Math.random() * 20;
      
      // Add noise for deformation
      const noise = Math.sin(theta * 3) * Math.cos(phi * 2) * 10;
      const finalRadius = radius + noise;

      positions[i * 3] = finalRadius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = finalRadius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = finalRadius * Math.cos(phi);

      // Store original positions
      originalPositions[i * 3] = positions[i * 3];
      originalPositions[i * 3 + 1] = positions[i * 3 + 1];
      originalPositions[i * 3 + 2] = positions[i * 3 + 2];

      // Assign random grayscale colors (black to gray)
      // Range from 0 (black) to 0.5 (medium gray)
      const grayValue = Math.random() * 0.5;
      colors[i * 3] = grayValue;     // R
      colors[i * 3 + 1] = grayValue; // G
      colors[i * 3 + 2] = grayValue; // B
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      transparent: true,
      opacity: 0.8,
      vertexColors: true // Enable vertex colors
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = { 
      mesh: particles, 
      originalPositions,
      positions: geometry.attributes.position.array 
    };

    // Animation
    let animationId;
    let time = 0;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.005;

      // Get audio data
      let audioLevel = 0;
      if (analyserRef.current && dataArrayRef.current && isListening) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
        audioLevel = sum / dataArrayRef.current.length / 255;
      }

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
        const wave = Math.sin(time + distance * 0.02) * 3;
        
        // Audio reactive scaling
        const audioScale = 1 + audioLevel * 0.5;
        
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
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [isListening]);

  const startListening = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      setIsListening(true);
    } catch (err) {
      setError('Mikrofon-Zugriff verweigert. Bitte erlauben Sie den Zugriff.');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopListening = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
    }
    setIsListening(false);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 flex gap-4">
        {!isListening ? (
          <button
            onClick={startListening}
            className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg"
          >
            🎤 Mikrofon aktivieren
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-lg"
          >
            ⏹️ Mikrofon stoppen
          </button>
        )}
      </div>

      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isListening && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          🎤 Mikrofon aktiv - Sprich, um die Sphäre zu beeinflussen!
        </div>
      )}

      <div ref={containerRef} className="flex-1 w-full" />

      {/* Logo in the center background */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="bg-white rounded-full p-3 shadow-lg">
          <img 
            src="/mnt/user-data/uploads/PrivatecharterX_logo_vectorized_glb.png" 
            alt="PrivateCharterX Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center text-black text-sm bg-white bg-opacity-80 px-4 py-2 rounded">
        <p className="font-semibold">Voice Reactive Sphere</p>
        <p className="text-xs opacity-70">Invertierte Farben • Animiert • Audio-Reaktiv</p>
      </div>
    </div>
  );
}

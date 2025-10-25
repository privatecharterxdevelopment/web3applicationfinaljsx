import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface City {
  name: string;
  lat: number;
  lon: number;
}

const Globe3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cityLabelsRef = useRef<Array<{ element: HTMLDivElement; marker: THREE.Mesh }>>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let globe: THREE.Points;
    let cityMarkers: THREE.Group;
    let flightLines: THREE.Group;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let time = 0;
    let audioIntensity = 0;
    let animationFrameId: number;

    const windowHalfX = containerRef.current.clientWidth / 2;
    const windowHalfY = containerRef.current.clientHeight / 2;

    const cities: City[] = [
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
      { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
      { name: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
      { name: 'Zurich', lat: 47.3769, lon: 8.5417 },
      { name: 'Miami', lat: 25.7617, lon: -80.1918 },
      { name: 'London', lat: 51.5074, lon: -0.1278 },
      { name: 'New York', lat: 40.7128, lon: -74.0060 },
      { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
      { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
      { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
      { name: 'Monaco', lat: 43.7384, lon: 7.4246 },
      { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
      { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
      { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
      { name: 'Seoul', lat: 37.5665, lon: 126.9780 },
      { name: 'Mexico City', lat: 19.4326, lon: -99.1332 },
      { name: 'Vancouver', lat: 49.2827, lon: -123.1207 },
      { name: 'Cape Town', lat: -33.9249, lon: 18.4241 },
      { name: 'Melbourne', lat: -37.8136, lon: 144.9631 },
      { name: 'San Francisco', lat: 37.7749, lon: -122.4194 }
    ];

    function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = (radius * Math.sin(phi) * Math.sin(theta));
      const y = (radius * Math.cos(phi));

      return new THREE.Vector3(x, y, z);
    }

    function createGlobe() {
      const radius = 200;
      const geometry = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const originalPositions: number[] = [];

      const numPoints = 60000;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < numPoints; i++) {
        const y = 1 - (i / (numPoints - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;

        let poleModifier = 1.0;
        const absY = Math.abs(y);
        if (absY > 0.65) {
          const poleDistance = (absY - 0.65) / 0.35;
          poleModifier = 1.0 - (poleDistance * poleDistance * poleDistance * 0.8);
        }

        const x = Math.cos(theta) * radiusAtY * radius * poleModifier;
        const z = Math.sin(theta) * radiusAtY * radius * poleModifier;
        const yPos = y * radius * (0.8 + poleModifier * 0.2);

        vertices.push(x, yPos, z);
        originalPositions.push(x, yPos, z);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      (geometry as any).userData = { originalPositions: originalPositions };

      const colors = new Float32Array(numPoints * 3);
      for (let i = 0; i < numPoints * 3; i += 3) {
        colors[i] = 0.04;
        colors[i + 1] = 0.04;
        colors[i + 2] = 0.04;
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 1.2,
        transparent: true,
        opacity: 0.95,
        sizeAttenuation: true,
        vertexColors: true
      });

      globe = new THREE.Points(geometry, material);
      scene.add(globe);
    }

    function createCityMarkers() {
      const cityGroup = new THREE.Group();
      const radius = 197;

      cities.forEach(city => {
        const pos = latLonToVector3(city.lat, city.lon, radius);

        const cityGeometry = new THREE.CircleGeometry(2, 16);
        const cityMaterial = new THREE.MeshBasicMaterial({
          color: 0x0a0a0a,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide
        });

        const cityMarker = new THREE.Mesh(cityGeometry, cityMaterial);
        cityMarker.position.copy(pos);
        cityMarker.lookAt(0, 0, 0);
        (cityMarker as any).userData.city = city;
        (cityMarker as any).userData.position3D = pos;

        cityGroup.add(cityMarker);

        const label = document.createElement('div');
        label.className = 'city-label';
        label.textContent = city.name;
        label.style.position = 'absolute';
        label.style.color = '#0a0a0a';
        label.style.fontFamily = 'DM Sans, sans-serif';
        label.style.fontSize = '12px';
        label.style.fontWeight = '500';
        label.style.pointerEvents = 'none';
        label.style.whiteSpace = 'nowrap';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.textShadow = '0 0 3px rgba(255,255,255,0.8)';
        containerRef.current?.appendChild(label);
        cityLabelsRef.current.push({ element: label, marker: cityMarker });
      });

      cityMarkers = cityGroup;
      scene.add(cityMarkers);
    }

    function createFlightLines() {
      const lineGroup = new THREE.Group();
      const radius = 197;

      const connections = [
        ['London', 'New York'],
        ['London', 'Dubai'],
        ['Dubai', 'Singapore'],
        ['New York', 'Los Angeles'],
        ['Hong Kong', 'Tokyo'],
        ['Singapore', 'Sydney'],
        ['Dubai', 'Hong Kong'],
        ['New York', 'Miami'],
        ['Tokyo', 'San Francisco'],
        ['Singapore', 'Bangkok'],
        ['Dubai', 'Mumbai'],
        ['New York', 'Toronto'],
        ['Hong Kong', 'Singapore'],
        ['Dubai', 'Cape Town'],
        ['Seoul', 'Tokyo'],
        ['London', 'Singapore'],
        ['Dubai', 'Tokyo'],
        ['Los Angeles', 'Tokyo']
      ];

      connections.forEach((connection, index) => {
        const city1 = cities.find(c => c.name === connection[0]);
        const city2 = cities.find(c => c.name === connection[1]);

        if (city1 && city2) {
          const pos1 = latLonToVector3(city1.lat, city1.lon, radius);
          const pos2 = latLonToVector3(city2.lat, city2.lon, radius);

          const curve = new THREE.QuadraticBezierCurve3(
            pos1,
            new THREE.Vector3(
              (pos1.x + pos2.x) / 2 * 1.15,
              (pos1.y + pos2.y) / 2 * 1.15,
              (pos1.z + pos2.z) / 2 * 1.15
            ),
            pos2
          );

          const points = curve.getPoints(60);
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const colors = new Float32Array(points.length * 3);
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

          const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 1.0
          });

          const line = new THREE.Line(geometry, material);
          (line as any).userData.animationOffset = index * 2.5;
          (line as any).userData.city1 = city1;
          (line as any).userData.city2 = city2;
          lineGroup.add(line);
        }
      });

      flightLines = lineGroup;
      scene.add(flightLines);
    }

    function isCityVisible(cityName: string): boolean {
      if (!cityMarkers) return false;
      const cityMarker = cityMarkers.children.find((m: any) => m.userData.city.name === cityName) as THREE.Mesh;
      if (!cityMarker) return false;
      const worldPos = new THREE.Vector3();
      cityMarker.getWorldPosition(worldPos);
      const cameraDirection = new THREE.Vector3().subVectors(camera.position, worldPos).normalize();
      const markerNormal = worldPos.clone().normalize();
      return cameraDirection.dot(markerNormal) > -0.2;
    }

    function updateCityLabels() {
      cityLabelsRef.current.forEach(({ element, marker }) => {
        const vector = marker.position.clone();
        vector.applyMatrix4(cityMarkers.matrixWorld);
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * (containerRef.current?.clientWidth || 0);
        const y = (vector.y * -0.5 + 0.5) * (containerRef.current?.clientHeight || 0);

        if (vector.z < 1) {
          element.style.display = 'block';
          element.style.left = x + 'px';
          element.style.top = y + 'px';
        } else {
          element.style.display = 'none';
        }
      });
    }

    function init() {
      scene = new THREE.Scene();
      scene.background = null;

      camera = new THREE.PerspectiveCamera(
        45,
        containerRef.current!.clientWidth / containerRef.current!.clientHeight,
        1,
        2000
      );
      camera.position.z = 600;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 0);
      containerRef.current!.appendChild(renderer.domElement);

      createGlobe();
      createCityMarkers();
      createFlightLines();

      const onMouseMove = (event: MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        targetMouseX = (event.clientX - rect.left - windowHalfX) * 1.5;
        targetMouseY = (event.clientY - rect.top - windowHalfY) * 1.5;
      };

      const onClick = () => {
        audioIntensity = 1.0;
      };

      containerRef.current?.addEventListener('mousemove', onMouseMove);
      containerRef.current?.addEventListener('click', onClick);
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      time += 0.01;

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      if (audioIntensity > 0) {
        audioIntensity -= 0.018;
      }

      if (globe) {
        globe.rotation.y += 0.003;
        globe.rotation.x = Math.sin(time * 0.3) * 0.08;

        const positions = globe.geometry.attributes.position.array as Float32Array;
        const original = (globe.geometry as any).userData.originalPositions;

        for (let i = 0; i < positions.length; i += 3) {
          const ox = original[i];
          const oy = original[i + 1];
          const oz = original[i + 2];

          const lat = Math.acos(oy / Math.sqrt(ox * ox + oy * oy + oz * oz));
          const lon = Math.atan2(oz, ox);

          const wave1 = Math.sin(time * 0.8 + lat * 6) * 2.5;
          const wave2 = Math.cos(time * 1.0 + lat * 8) * 2.0;
          const wave3 = Math.sin(time * 1.2 + lat * 10) * 1.8;

          const horizontalWave1 = Math.sin(time * 0.9 + lon * 5) * Math.cos(lat * 3) * 1.5;
          const horizontalWave2 = Math.cos(time * 1.1 + lon * 7) * Math.sin(lat * 4) * 1.3;

          const spiral1 = Math.sin(time * 0.7 + lat * 4 + lon * 3) * 1.4;
          const spiral2 = Math.cos(time * 1.3 + lat * 5 - lon * 4) * 1.2;

          const counterWave1 = Math.sin(-time * 0.85 + lat * 7) * 1.6;
          const counterWave2 = Math.cos(-time * 1.15 + lat * 9) * 1.4;

          const audioWave = Math.sin(time * 8 + lat * 5) * audioIntensity * 12;

          const totalWave = wave1 + wave2 + wave3 +
                           horizontalWave1 + horizontalWave2 +
                           spiral1 + spiral2 +
                           counterWave1 + counterWave2 +
                           audioWave;

          const factor = 0.012;
          const deform = 1 + totalWave * factor;

          positions[i] = ox * deform;
          positions[i + 1] = oy * deform;
          positions[i + 2] = oz * deform;
        }

        globe.geometry.attributes.position.needsUpdate = true;

        const colors = globe.geometry.attributes.color.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          const ox = original[i];
          const oy = original[i + 1];
          const oz = original[i + 2];

          const lat = Math.acos(oy / Math.sqrt(ox * ox + oy * oy + oz * oz));
          const lon = Math.atan2(oz, ox);

          const brightness1 = Math.sin(time * 0.8 + lat * 6) * 0.5 + 0.5;
          const brightness2 = Math.cos(time * 1.0 + lon * 5) * 0.5 + 0.5;
          const brightness3 = Math.sin(time * 1.2 + lat * 8 + lon * 4) * 0.5 + 0.5;
          const brightness4 = Math.cos(time * 0.9 + lat * 4 - lon * 3) * 0.5 + 0.5;

          const combinedBrightness = (brightness1 + brightness2 + brightness3 + brightness4) / 4;
          const finalBrightness = 0.03 + combinedBrightness * 0.62;

          colors[i] = finalBrightness;
          colors[i + 1] = finalBrightness;
          colors[i + 2] = finalBrightness;
        }

        globe.geometry.attributes.color.needsUpdate = true;
        (globe.material as THREE.PointsMaterial).opacity = 0.95 + Math.sin(time * 1.2) * 0.02;
      }

      if (cityMarkers) {
        cityMarkers.rotation.x = globe.rotation.x;
        cityMarkers.rotation.y = globe.rotation.y;
        updateCityLabels();
      }

      if (flightLines) {
        flightLines.rotation.x = globe.rotation.x;
        flightLines.rotation.y = globe.rotation.y;

        flightLines.children.forEach((line: any) => {
          const city1Visible = isCityVisible(line.userData.city1.name);
          const city2Visible = isCityVisible(line.userData.city2.name);

          if (city1Visible && city2Visible) {
            line.visible = true;
            const colors = line.geometry.attributes.color.array;
            const numPoints = colors.length / 3;

            const cycleDuration = 6.0;
            const progress = ((time * 0.4 + line.userData.animationOffset) % cycleDuration) / cycleDuration;

            for (let i = 0; i < numPoints; i++) {
              const pointPos = i / numPoints;
              let brightness = 0;

              if (progress <= 0.25) {
                const drawProgress = progress / 0.25;
                const trailLength = 0.2;
                const distanceFromHead = drawProgress - pointPos;

                if (distanceFromHead >= 0 && distanceFromHead < trailLength) {
                  const fade = 1 - (distanceFromHead / trailLength);
                  brightness = Math.pow(fade, 2) * 0.5;
                } else if (pointPos < (drawProgress - trailLength)) {
                  brightness = 0.5;
                }
              } else if (progress <= 0.30) {
                brightness = 0.5;
              } else if (progress <= 0.50) {
                const fadeProgress = (progress - 0.30) / 0.20;
                const fadeHead = fadeProgress;
                const fadeTrailLength = 0.25;

                if (pointPos < (fadeHead - fadeTrailLength)) {
                  brightness = 0;
                } else if (pointPos >= (fadeHead - fadeTrailLength) && pointPos < fadeHead) {
                  const distanceFromFadeHead = fadeHead - pointPos;
                  const fade = distanceFromFadeHead / fadeTrailLength;
                  brightness = 0.5 * Math.pow(fade, 2);
                } else {
                  brightness = 0.5;
                }
              } else {
                brightness = 0;
              }

              colors[i * 3] = brightness;
              colors[i * 3 + 1] = brightness;
              colors[i * 3 + 2] = brightness;
            }
            line.geometry.attributes.color.needsUpdate = true;
          } else {
            line.visible = false;
          }
        });
      }

      camera.position.x += (mouseX * 0.2 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.2 - camera.position.y) * 0.05;
      camera.position.z = 600 + Math.sin(time * 0.3) * 15;

      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }

    init();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);

      cityLabelsRef.current.forEach(({ element }) => {
        element.remove();
      });
      cityLabelsRef.current = [];

      if (renderer && containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }

      if (renderer) {
        renderer.dispose();
      }

      if (globe) {
        globe.geometry.dispose();
        (globe.material as THREE.Material).dispose();
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
};

export default Globe3D;

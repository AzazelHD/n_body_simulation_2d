import * as THREE from "three";

// export class Starfield {
//   constructor(scene, camera) {
//     this.scene = scene;
//     this.camera = camera;

//     // Parameters
//     this.starsCount = 1000; // Number of stars
//     this.starSize = 1; // Base size of the stars
//     this.starFieldRadius = 500; // The "radius" of the starfield

//     // Create the starfield
//     this.createStarfield();
//   }

//   createStarfield() {
//     const particlesGeometry = new THREE.BufferGeometry();
//     const positions = [];
//     const sizes = [];

//     // Randomly distribute stars in 3D space
//     for (let i = 0; i < this.starsCount; i++) {
//       positions.push(Math.random() * this.starFieldRadius * 2 - this.starFieldRadius); // x
//       positions.push(Math.random() * this.starFieldRadius * 2 - this.starFieldRadius); // y
//       positions.push(Math.random() * this.starFieldRadius * 2 - this.starFieldRadius); // z
//       sizes.push(this.starSize); // All stars are the same size
//     }

//     particlesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
//     particlesGeometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

//     // Particle material
//     const particlesMaterial = new THREE.PointsMaterial({
//       color: 0xffffff, // White stars
//       size: this.starSize, // Star size
//       sizeAttenuation: false, // Prevent size decrease with camera distance
//       transparent: true,
//       opacity: 0.7, // Slight transparency
//     });

//     // Create the particle system
//     this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
//     this.scene.add(this.particles);
//   }

//   update() {
//     // Make the stars rotate slowly to create a dynamic background
//     this.particles.rotation.x += 0.001;
//     this.particles.rotation.y += 0.001;
//   }
// }

export class Starfield {
  #scene;
  #starCount;
  #size;

  constructor(scene, starCount = 1000, size = 50) {
    this.#scene = scene;
    this.#starCount = starCount;
    this.#size = size;

    // Create the starfield
    this.#createStarfield();
  }

  // Method to create the starfield
  #createStarfield() {
    // Create geometry for the stars
    const geometry = new THREE.BufferGeometry();

    // Arrays to hold the positions, colors, and sizes of the stars
    const positions = new Float32Array(this.#starCount * 3);
    const colors = new Float32Array(this.#starCount * 3);
    const sizes = new Float32Array(this.#starCount);

    // Randomly generate the starfield
    for (let i = 0; i < this.#starCount; i++) {
      const x = Math.random() * 2 - 1;
      const y = Math.random() * 2 - 1;
      const z = -10;

      positions[i * 3] = x * 2000;
      positions[i * 3 + 1] = y * 2000;
      positions[i * 3 + 2] = z;

      // White color for the stars
      colors[i * 3] = 1.0; // R
      colors[i * 3 + 1] = 1.0; // G
      colors[i * 3 + 2] = 1.0; // B

      // Random star size
      sizes[i] = Math.random() * 3 + 1; // Between 1 and 4
    }

    // Set geometry attributes
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("customColor", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Shader material for the stars
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) }, // White color
      },
      vertexShader: this.#vertexShader(),
      fragmentShader: this.#fragmentShader(),
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    // Create Points system
    this.starfield = new THREE.Points(geometry, shaderMaterial);

    // Add to the scene
    this.#scene.add(this.starfield);
  }

  // Vertex Shader
  #vertexShader() {
    return `
        attribute vec3 customColor;
        attribute float size;
        varying vec3 vColor;
        void main() {
            vColor = customColor;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z); // Size based on distance
            gl_Position = projectionMatrix * mvPosition;
        }
    `;
  }

  // Fragment Shader
  #fragmentShader() {
    return `
        uniform vec3 color;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor * color, 1.0); // White color
        }
    `;
  }

  // Update method (optional, for animations or dynamic changes)
  update() {
    // You can add dynamic updates here (e.g., animate starfield movement, color changes, etc.)
    // For example, rotating the starfield:
    // this.starfield.rotation.x += 0.001;
    // this.starfield.rotation.y += 0.001;
  }

  // Optionally remove the starfield from the scene
  remove() {
    this.#scene.remove(this.starfield);
  }
}

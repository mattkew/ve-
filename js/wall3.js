import Perlin from './perlin-noise-sb.js';
import * as THREE from "../node_modules/three/build/three.module.js"

const COLORS = {
    LIGHT_GRAY: 0x000000, // 0xEEEEEE,
    WHITE:  0xFFFFFF
}

let width = window.innerWidth;
let height = window.innerHeight;

let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
camera.position.y = 0
camera.position.z = 0
camera.rotation.x = 0

let renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setClearColor(COLORS.LIGHT_GRAY);
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( width, height );
renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement );

// VR
import { VRButton } from './VRButton.js';
document.body.appendChild( VRButton.createButton( renderer ) );
renderer.xr.enabled = true;
// Controllers here


// Fog
{
    const near =100;
    const far = 300;
    const color = COLORS.LIGHT_GRAY // 'lightblue';
    scene.fog = new THREE.Fog(color, near, far);
    //scene.background = new THREE.Color(color);
}

// Spotlight
const lcolor = 0xFFFFFF;
const lintensity = .5;
const light = new THREE.SpotLight(lcolor, lintensity);
light.position.set(0, 600, -0);
light.target.position.set(0, 0, -200);
light.castShadow = true;
scene.add(light);
scene.add(light.target);
//const helper = new THREE.SpotLightHelper(light);
//scene.add(helper);

// Ambient Light
const color = 0xFFFFFF;
const intensity = 0 // .0125 // .45;
const ambientlight = new THREE.AmbientLight(color, intensity);
scene.add(ambientlight);

let geometry = new THREE.PlaneBufferGeometry( 200, 200, 32, 32 )

let material = new THREE.MeshPhongMaterial( { 
    color: 0x4f4f63, // COLORS.WHITE,
    // envMap: envMap, // optional environment map
    specular: 0xffffff,
    shininess: 100,
    reflectivity: 1,
    // flatShading: true, 
    receiveShadow: true,
    castShadow: true,
    // wireframe: true
} ) 

let wall = new THREE.Mesh( geometry, material );
wall.castShadow = true;
wall.receiveShadow = true
wall.rotation.x = 90 
wall.position.y = 0 // 150
wall.lookAt(0, 0, 0)
wall.position.z = -200
scene.add( wall );

let zIncrement = -200 // replaced wall.position.z see further down below

let perlin = new Perlin();
let amp = 100
let smoothing = 0.05
function refreshVertices() {
    let vertices = wall.geometry.attributes.position.array;
    for (let i = 0; i <= vertices.length; i += 3) {
        vertices[i+2] = amp * perlin.noise(
            (wall.position.x + vertices[i]) / smoothing, 
            (zIncrement + vertices[i+1]) / smoothing
        );
    }
    wall.geometry.attributes.position.needsUpdate = true;
    // wall.geometry.normalizeNormals();
    wall.geometry.computeVertexNormals();
}

let clock = new THREE.Clock();
let movementSpeed = 0.025


//////////////





let fft = undefined
// attach a click listener to a play button
document.querySelector('button').addEventListener('click', async () => {
    //let Tone = await import('../node_modules/tone/build/Tone.js');
    await Tone.start()
    const player = new Tone.Player("./resources/audio/vr-f-fall.mp3").toDestination();
    player.loop = true;
    player.autostart = true;

    
    const bands = 128
    fft = new Tone.FFT(bands)
    fft.smoothing = 0.999999 // 0.999999
    // fft.sampleTime = 512
    player.chain(fft, Tone.Master)
    console.log([...Array.from(Array(bands).keys())].map(index => fft.getFrequencyOfIndex(index)));

    console.log("--->" + fft.getValue())

    // your page is ready to play sounds

    /*
    (32) [0, 689.0625, 1378.125, 2067.1875, 2756.25, 3445.3125, 4134.375, 4823.4375, 5512.5, 6201.5625, 6890.625, 7579.6875, 8268.75, 8957.8125, 9646.875, 10335.9375, 11025, 11714.0625, 12403.125, 13092.1875, 13781.25, 14470.3125, 15159.375, 15848.4375, 16537.5, 17226.5625, 17915.625, 18604.6875, 19293.75, 19982.8125, 20671.875, 21360.9375]
    */
})






///////////////



const pGeometry = new THREE.BufferGeometry();
const vertices = [];

const textureLoader = new THREE.TextureLoader();

const sprite1 = textureLoader.load( './resources/images/flare-2.png' );

for ( let i = 0; i < 100; i ++ ) {
    const x = Math.random() * 200 - 100;
    const y = Math.random() * 200 - 100;
    const z = Math.random() * -200 + 100;
    vertices.push( x, y, z );
}

pGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

//const pColor = 0xFFFFFF;
//const sprite = sprite1;
const size = 2;

const pMaterial = new THREE.PointsMaterial( { size: size, map: sprite1, blending: THREE.AdditiveBlending, depthTest: false, transparent: true } );
material.color.setHSL( 0, 0, 100 );

const particles = new THREE.Points( pGeometry, pMaterial );

particles.rotation.x = Math.random() * 6;
particles.rotation.y = Math.random() * 6;
particles.rotation.z = Math.random() * 6;

scene.add(particles)











function update() {


    ///
    let av = (fft !== undefined ? fft.getValue()[0] : 0) * 0.06
    //if(fft !== undefined) console.log("--->" + fft.getValue())



    ////

    let delta = clock.getDelta();
    // wall.position.z += movementSpeed * delta;
    zIncrement = movementSpeed * delta + av; // wall.position.z += movementSpeed * delta;
    refreshVertices();
    renderer.render( scene, camera );
}

renderer.setAnimationLoop(update)




/*
Wavy Text
Author Frédéric Dilé
19/02/2022
frederic.dile@gmail.com
fdile.com
*/

import * as THREE from 'three';
import * as gsap from 'gsap';
import * as dat from 'dat-gui';
import Stats from 'three/examples/jsm/libs/stats.module';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import {preloadFont, Text} from 'troika-three-text'

import fragment from './shaders/frag.glsl';
import vertex from './shaders/vert.glsl';

import fontFileUrl from '../fonts/BebasNeue-Regular.ttf'
import tnoise from '../img/noise.png'

let OrbitControls = require( 'three-orbit-controls' )( THREE );

const degrees_to_radians = deg => (deg * Math.PI) / 180.0;

export default class App{

  constructor(){

    this.settings = {

      progress: 0.2,
      freq: 7.7,
      amp: 0.25,
      camx:15,
      camy:-17,
      camz:18,
      fontSize: 5.8,
      lineHeight: 0.72,
      offsetY: 0,

      noiseAmount: 0.8,
      bloomStrength: 0.3,
      bloomRadius: 0.3,
      bloomThreshold: 0.5,

    }


    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( this.width, this.height );
    this.renderer.setClearColor( 0x000000, 1 );

    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container = document.getElementById( 'container' );
    this.container.appendChild( this.renderer.domElement );
    
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera( 10, window.innerWidth / window.innerHeight, 0.01, 10000 );
    this.camera.position.set( -70, 70, 70 ); 
    this.camera.lookAt( this.scene.position );

    // this.controls = new OrbitControls( this.camera );

    // Stats
    // this.stats = new Stats();
    // document.body.appendChild( this.stats.dom );    

    let that = this

    this.tnoise
    const ldr = new THREE.TextureLoader()
    ldr.load( tnoise, ( texture )=>{
      
      texture.wrapS = texture.wrapT = 1.
      texture.repeat = THREE.RepeatWrapping
      this.tnoise = texture

    })

    preloadFont(
      {
        font: fontFileUrl, 
        characters: 'Dabcdefghijklmnopqrstuvxyz'
      },
      () => {
        that.setUpText()
      }
    )

    this.addPostProcessing()
    this.resize();
    this.setupGUI();

    this.render();
    this.setupResize();

  }

  setUpText(){

    this.myText = new Text()

    this.myText.font = fontFileUrl
    this.myText.text = 'MAKE WAVES'
    this.myText.text = 'WHAT\nGOES\nAROUND\nCOMES\nAROUND\n'
    this.myText.text += 'WHAT\nGOES\nAROUND\nCOMES\nAROUND\n'

    this.myText.fontSize = this.settings.fontSize
    this.myText.anchorX = 'center'
    this.myText.anchorY = 'middle'
    this.myText.letterSpacing = -0.05
    this.myText.lineHeight = this.settings.lineHeight

    this.myText.color = 0xFFFFFF
    this.myText.glyphGeometryDetail = 80
    
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      vertexShader:vertex,
      fragmentShader:fragment,
      uniforms:{
        time: { type: "f", value: 0. },
        ucolor: { value: new THREE.Color( 0xe1e1e1 ) },
        ucolor2: { value: new THREE.Color( 0x000000 ) },
        unoise: { value:  this.tnoise },
        progress: { value: this.settings.progress },
        freq: { value: this.settings.freq },
        amp: { value: this.settings.amp },
        offsetY: { value: this.settings.offsetY },
        resolution: { type: "v4", value: new THREE.Vector4() },
      },
      side:THREE.DoubleSide,
    });

    this.myText.material = this.material
    this.scene.add( this.myText )
    this.myText.sync()

  }

  setupGUI() {
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'progress', 0., 1., 0, 0.01);
    this.gui.add(this.settings, 'freq', 0., 10., 0, 0.01);
    this.gui.add(this.settings, 'amp', 0., 1., 0, 0.01);

    this.gui.add(this.settings, 'fontSize', 0.1, 10., 0, 0.01).onChange(()=>{
      this.myText.fontSize = this.settings.fontSize
    });
    this.gui.add(this.settings, 'lineHeight', 0.1, 1., 0, 0.01).onChange(()=>{
      this.myText.lineHeight = this.settings.lineHeight
    });
    this.gui.add(this.settings, 'offsetY', 0.01, 2., 0, 0.01).step(0.01)
  
    let that = this;

    function filmUpdate() {
      that.filmPass.noiseIntensity = that.settings.noiseAmount;
    }

    function bloomUpdate(){
      that.unBloomPass.strength = that.settings.bloomStrength;
      that.unBloomPass.radius = that.settings.bloomRadius;
      that.unBloomPass.threshold = that.settings.bloomThreshold;
    }

    this.gui.add(this.settings, 'bloomStrength', 0., 2., 0, 0.01).onChange(bloomUpdate);
    this.gui.add(this.settings, 'bloomRadius', 0., 2., 0, 0.01).onChange(bloomUpdate);
    this.gui.add(this.settings, 'bloomThreshold', 0., 2., 0, 0.01).onChange(bloomUpdate);
    this.gui.add(this.settings, 'noiseAmount', 0., 2., 0, 0.01).onChange(filmUpdate);

  
  
  }


  addPostProcessing(){

    this.filmPass = new FilmPass(
      0.4,   // noise intensity
      0.0,  // scanline intensity
      0,    // scanline count
      false,  // grayscale
    );
    this.filmPass.noiseIntensity = this.settings.noiseAmount;
    const bloomPass = new BloomPass( 1.5, 2, 0.3, 2000 )
    const bokehPass = new BokehPass( this.scene, this.camera, {
      focus: 1.0,
      aperture: 0.025,
      maxblur: 10.01,

      width: this.width,
      height: this.height
    } );

    this.unBloomPass = new UnrealBloomPass();
    // unBloomPass.renderToScreen = true;

    this.unBloomPass.resolution = new THREE.Vector2( this.width, this.height );
    this.unBloomPass.strength = this.settings.bloomStrength;
    this.unBloomPass.radius = this.settings.bloomRadius;
    this.unBloomPass.threshold = this.settings.bloomThreshold;

    const renderScene = new RenderPass( this.scene, this.camera );

    this.composer = new EffectComposer( this.renderer );
    this.composer.addPass( renderScene );
    // this.composer.addPass( bloomPass );
    this.composer.addPass( this.unBloomPass );
    // this.composer.addPass( bokehPass );
    this.composer.addPass( this.filmPass );

  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    
    this.camera.updateProjectionMatrix();

  }

  render( time ) {

    // this.stats.begin();
    
    if( this.material  ){
      this.material.uniforms.time.value = time * 0.005;
      this.material.uniforms.progress.value = this.settings.progress;
      this.material.uniforms.freq.value = this.settings.freq;
      this.material.uniforms.amp.value = this.settings.amp;
      this.material.uniforms.offsetY.value = this.settings.offsetY;
    }

    // this.renderer.render( this.scene, this.camera );

    this.composer.render();
    
    // this.stats.end();

    window.requestAnimationFrame( this.render.bind(this) );

  }

}

new App();

import * as Three from "three"

import { Controls } from "./controls"
import { Level, createLevel } from "./level"

console.log("Hello, world!")

const scene = new Three.Scene()
const camera = new Three.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new Three.WebGLRenderer()

const controls = new Controls(camera)

const initialLevel: Level = {
  startPosition: new Three.Vector3(0, 0, 0),
  blocks: [{
    size: new Three.Vector3(10, 1, 10),
    position: new Three.Vector3(0, -1, 0),
    rotation: new Three.Quaternion()
  }, {
    size: new Three.Vector3(10, 1, 10),
    position: new Three.Vector3(0, 3, 0),
    rotation: new Three.Quaternion()
  }, {
    size: new Three.Vector3(10, 5, 1),
    position: new Three.Vector3(0, 1, -5.5),
    rotation: new Three.Quaternion()
  }, {
    size: new Three.Vector3(10, 5, 1),
    position: new Three.Vector3(0, 1, 5.5),
    rotation: new Three.Quaternion()
  }, {
    size: new Three.Vector3(1, 5, 10),
    position: new Three.Vector3(-5.5, 1, 0),
    rotation: new Three.Quaternion()
  }, {
    size: new Three.Vector3(1, 5, 10),
    position: new Three.Vector3(5.5, 1, 0),
    rotation: new Three.Quaternion()
  }]
}

function init() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  scene.add(new Three.AmbientLight(0xffffff, 0.1))

  const pointLight = new Three.PointLight(0xffffff, 1.0)
  pointLight.position.set(0, 2, 0)
  scene.add(pointLight)

  camera.position.copy(initialLevel.startPosition)
  createLevel(initialLevel, scene)

  controls.install()

  renderFrame()
}

function renderFrame() {
  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(renderFrame)
}

init()

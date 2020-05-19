import * as Three from "three"

import { Controls } from "./controls"

console.log("Hello, world!")

const scene = new Three.Scene()
const camera = new Three.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new Three.WebGLRenderer()

const controls = new Controls(camera)

function init() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  camera.position.set(0, 0, 0)

  for (let i = 0; i < 16; i++) {
    const alpha = i * 2 * Math.PI / 16

    const color = new Three.Color()
    color.setHSL(i / 16, 1.0, 0.5)

    const cube = new Three.Mesh(
      new Three.BoxGeometry(1, 1, 1),
      new Three.MeshBasicMaterial({ color })
    )
    cube.position.set(Math.cos(alpha) * 10, 0, Math.sin(alpha) * 10)
    scene.add(cube)
  }

  controls.install()

  renderFrame()
}

function renderFrame() {
  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(renderFrame)
}

init()

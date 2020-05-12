import * as Three from "three"

console.log("Hello, world!")

const scene = new Three.Scene()
const camera = new Three.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new Three.WebGLRenderer()

function init() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    renderFrame()
}

function renderFrame() {
    renderer.render(scene, camera)
    requestAnimationFrame(renderFrame)
}

init()

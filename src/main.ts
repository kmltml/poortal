import * as Three from "three"

import { Controls } from "./controls"
import { Level, createLevel } from "./level"
import { Portal, PortalColor } from "./portal"

console.log("Hello, world!")

const scene = new Three.Scene()
const camera = new Three.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new Three.WebGLRenderer({
  antialias: true
})

const controls = new Controls(camera)

const textureLoader = new Three.TextureLoader()
const portalMask = textureLoader.load("tex/portal_mask.png")
const portalBlue = textureLoader.load("tex/portal_blue.png")
const portalOrange = textureLoader.load("tex/portal_orange.png")

declare var Stats: any

const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

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

const portals: Portal[] = []

function init() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  scene.add(new Three.AmbientLight(0xffffff, 0.1))

  const pointLight = new Three.PointLight(0xffffff, 1.0)
  pointLight.position.set(0, 2, 0)
  scene.add(pointLight)

  camera.position.copy(initialLevel.startPosition)
  createLevel(initialLevel, scene)

  controls.install(renderer.domElement)

  portals[0] = createPortal(
    <Three.Mesh> scene.children[4],
    new Three.Vector3(2.5, 0.25, -4.999),
    new Three.Vector3(0, 0, 1),
    PortalColor.Blue
  )
  portals[1] = createPortal(
    <Three.Mesh> scene.children[5],
    new Three.Vector3(2.5, 0.25, 4.999),
    new Three.Vector3(0, 0, -1),
    PortalColor.Orange
  )
  portals[0].otherPortal = portals[1]
  portals[1].otherPortal = portals[0]

  scene.add(new Three.Mesh(
    new Three.BoxGeometry(),
    [
      new Three.MeshBasicMaterial({color: "red"}),
      new Three.MeshBasicMaterial({color: "green"}),
      new Three.MeshBasicMaterial({color: "blue"}),
      new Three.MeshBasicMaterial({color: "magenta"}),
      new Three.MeshBasicMaterial({color: "cyan"}),
      new Three.MeshBasicMaterial({color: "yellow"}),
    ]
  ))

  renderFrame()
}

function createPortal(wall: Three.Mesh, position: Three.Vector3, normal: Three.Vector3, color: PortalColor): Portal {
  const border = (color == PortalColor.Blue) ? portalBlue : portalOrange
  const portal = new Portal(wall, color, portalMask, border)
  portal.mesh.position.copy(position)
  portal.mesh.setRotationFromAxisAngle(
    new Three.Vector3(0, 1, 0),
    new Three.Vector3(0, 0, 1).angleTo(normal)
  )
  scene.add(portal.mesh)

  return portal
}

function renderFrame() {
  controls.update()

  stats.begin()

  for (let portal of portals) {
    portal.render(camera, scene, renderer)
  }

  renderer.render(scene, camera)

  stats.end()

  requestAnimationFrame(renderFrame)
}

init()

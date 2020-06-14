import * as Three from "three"

import { Level, createLevel } from "./level"
import { Portal, PortalColor } from "./portal"
import { Physics } from "./physics"
import { Player } from "./player"
import { Hud } from "./hud"
import { UserData } from "./userdata"

export const scene = new Three.Scene()

export const renderer = new Three.WebGLRenderer({
  antialias: true
})

renderer.autoClear = false
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.clippingPlanes = [new Three.Plane()]

export const physics = new Physics()
export const player = new Player(scene, physics)

player.initPhysics()

const textureLoader = new Three.TextureLoader()
Portal.textures = {
  mask: textureLoader.load("tex/portal_mask.png"),
  blueBorder: textureLoader.load("tex/portal_blue.png"),
  orangeBorder: textureLoader.load("tex/portal_orange.png")
}

export const hud = new Hud(renderer, textureLoader)

declare var Stats: any

const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

const initialLevel: Level = {
  startPosition: new Three.Vector3(-2, 1, 0),
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
  }, {
    size: new Three.Vector3(1, 5, 5),
    position: new Three.Vector3(0, 1, 0),
    rotation: new Three.Quaternion()
  }]
}

function init() {
  document.body.appendChild(renderer.domElement)

  scene.add(new Three.AmbientLight(0xffffff, 0.1))

  const pointLight = new Three.PointLight(0xffffff, 0.5)
  pointLight.position.set(-4, 2, -4)
  scene.add(pointLight)

  const pointLight2 = new Three.PointLight(0xffffff, 0.5)
  pointLight2.position.set(4, 2, 4)
  scene.add(pointLight2)

  player.setPosition(initialLevel.startPosition)
  createLevel(initialLevel, scene, physics)

  player.controls.install(renderer.domElement)

  renderFrame()
}

function renderFrame() {
  player.update()

  physics.update()

  stats.begin()

  renderer.clear()

  for (let portal of player.portals) {
    if (portal) {
      portal.render(player.camera, scene, renderer)
    }
  }

  // Thankfully zero normal is treated as "Don't clip anything",
  // so i don't have to invent an arbitrary plane that won't clip anything.
  // Adding and removing a clipping plane each frame makes everything grind to a halt.
  // That's why we keep a clipping plane around all the time.
  ;(renderer.clippingPlanes[0] as Three.Plane)
     .setFromNormalAndCoplanarPoint(
       new Three.Vector3(0, 0, 0),
       new Three.Vector3(0, 0, 0)
     )

  renderer.render(scene, player.camera)

  hud.render(renderer)

  stats.end()

  requestAnimationFrame(renderFrame)
}

init()

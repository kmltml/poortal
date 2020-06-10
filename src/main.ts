import * as Three from "three"

import { Level, createLevel } from "./level"
import { Portal, PortalColor } from "./portal"
import { Physics } from "./physics"
import { Player } from "./player"
import { Hud } from "./hud"

export const scene = new Three.Scene()

export const renderer = new Three.WebGLRenderer({
  antialias: true
})

renderer.autoClear = false
renderer.setSize(window.innerWidth, window.innerHeight)

export const player = new Player(scene)
export const physics = new Physics()

player.initPhysics(physics)

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
  startPosition: new Three.Vector3(0, 1, 0),
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
  document.body.appendChild(renderer.domElement)

  scene.add(new Three.AmbientLight(0xffffff, 0.1))

  const pointLight = new Three.PointLight(0xffffff, 1.0)
  pointLight.position.set(0, 2, 0)
  scene.add(pointLight)

  player.setPosition(initialLevel.startPosition)
  createLevel(initialLevel, scene, physics)

  player.controls.install(renderer.domElement)

  player.portals[PortalColor.Blue] = Portal.create(
    <Three.Mesh> scene.children[5],
    new Three.Vector3(2.5, Portal.Height / 2 - 0.5, -4.999),
    new Three.Vector3(0, 0, 1),
    new Three.Vector3(0, 1, 0),
    PortalColor.Blue
  )
  player.portals[PortalColor.Orange] = Portal.create(
    <Three.Mesh> scene.children[6],
    new Three.Vector3(2.5, Portal.Height / 2 - 0.5, 4.999),
    new Three.Vector3(0, 0, -1),
    new Three.Vector3(0, 1, 0),
    PortalColor.Orange
  )
  player.portals[0].otherPortal = player.portals[1]
  player.portals[1].otherPortal = player.portals[0]

  scene.add(player.portals[0].mesh)
  scene.add(player.portals[1].mesh)

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

function renderFrame() {
  player.update()

  physics.update()

  stats.begin()

  renderer.clear()

  for (let portal of player.portals) {
    portal.render(player.camera, scene, renderer)
  }

  renderer.render(scene, player.camera)

  hud.render(renderer)

  stats.end()

  requestAnimationFrame(renderFrame)
}

init()

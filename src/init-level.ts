import { Vector3, Euler } from "three"

import { Level } from "./level"

export const initLevel: Level = {
  startPosition: new Vector3(-2, 1, 0),
  blocks: [{
    size: new Vector3(10, 1, 20),
    position: new Vector3(0, -1, 0),
  }, {
    size: new Vector3(10, 1, 25),
    position: new Vector3(0, 6, 2.5),
  }, {
    size: new Vector3(10, 6, 1),
    position: new Vector3(0, 2.5, -10.5),
  }, {
    size: new Vector3(4, 6, 1),
    position: new Vector3(-3, 2.5, 10.5),
  }, {
    size: new Vector3(1, 6, 20),
    position: new Vector3(-5.5, 2.5, 0),
  }, {
    size: new Vector3(1, 6, 20),
    position: new Vector3(5.5, 2.5, 0),
  }, {
    size: new Vector3(3, 3, 5),
    position: new Vector3(0, 1, 0),
  }, {
    size: new Vector3(5, 1, 5),
    position: new Vector3(2.5, -10, 12.5)
  }, {
    size: new Vector3(1, 15, 5),
    position: new Vector3(5.5, -2, 12.5),
    portalProof: true
  }, {
    size: new Vector3(1, 15, 5),
    position: new Vector3(-0.5, -2, 12.5),
    portalProof: true
  }, {
    size: new Vector3(5, 15, 1),
    position: new Vector3(2.5, -2, 15.5),
    portalProof: true
  }, {
    size: new Vector3(5, 8, 1),
    position: new Vector3(2.5, -5.5, 9.5),
    portalProof: true
  }, {
    size: new Vector3(3, 3, 3),
    position: new Vector3(-4, -0.5, 10),
    rotation: new Euler(Math.PI / 4, 0, 0)
  }]
}

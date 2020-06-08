import dat = require("dat.gui")

export class Debug {

  private static _instance?: Debug

  gui: dat.GUI = new dat.GUI()

  folders = {
    portalVisibility: this.gui.addFolder("Portal Visibility")
  }

  portalVisibility = {
    blue: false,
    orange: false
  }

  static get instance(): Debug {
    if (Debug._instance === undefined) {
      Debug._instance = new Debug()
    }
    return Debug._instance
  }

  constructor() {
    this.folders.portalVisibility.add(this.portalVisibility, "blue").listen()
    this.folders.portalVisibility.add(this.portalVisibility, "orange").listen()
    this.gui.show()
  }

}

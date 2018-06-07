"use strict"

const fs = require('fs');

module.exports = class ImputFile {
  constructor(filePath) {
    this.filePath = filePath;
  }

  // synchronous/blocking reading a file
  readFile() {
    let data;
    try {
      data = fs.readFileSync(this.filePath);
    } catch(e) {
      console.log(`Error code: ${ e.code}! `);
      return 1;
    }
    return data
  }

}

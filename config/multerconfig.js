const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
//disk setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
      crypto.pseudoRandomBytes(16, function (err, name) {
        const fn = name.toString('hex')+path.extname(file.originalname)
        cb(null, fn);
      })
      
    }
  })
  
  //export
  const upload = multer({ storage: storage })

  module.exports = upload
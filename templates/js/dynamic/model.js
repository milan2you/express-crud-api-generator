const mongoose = require('mongoose')
const Schema = mongoose.Schema

let singularSchema = new Schema(
  {
    name: {
      type: String
    }
  },
  { timestamps: {} }
)

module.exports = mongoose.model(capSingular, singularSchema)

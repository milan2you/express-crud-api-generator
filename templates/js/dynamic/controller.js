const capSingularModel = require('../models/singular')
const boom = require('boom')
module.exports = {
  getcapPlural: function(req, res, next) {
    capSingularModel
      .find()
      .then(plural =>
        res.status(200).json({
          message: 'capPlural get success',
          data: plural
        })
      )
      .catch(next)
  },
  getcapSingular: function(req, res, next) {
    capSingularModel
      .findById(req.params.id)
      .then(singular => {
        if (singular) {
          res.status(200).json({
            message: 'capSingular get success',
            data: singular
          })
        } else {
          next(boom.notFound())
        }
      })
      .catch(boom.internal())
  },
  createcapSingular: function(req, res, next) {
    let newsingular = new capSingularModel({
      name: req.body.name
    })
    newcapSingular
      .save()
      .then(singular => {
        res.status(200).json({
          message: 'capSingular successfully created',
          data: singular
        })
      })
      .catch(boom.internal())
  },
  updatecapSingular: function(req, res, next) {
    capSingularModel
      .findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name
        },
        { new: true } // return new updated document
      )
      .then(singular =>
        res.status(200).json({
          message: 'capSingular successfully updated',
          data: singular
        })
      )
      .catch(boom.internal())
  },
  deletecapSingular: function(req, res, next) {
    capSingularModel
      .findByIdAndRemove(req.params.id)
      .then(singular =>
        res.status(200).json({
          message: 'capSingular successfully deleted',
          data: singular
        })
      )
      .catch(boom.internal())
  }
}

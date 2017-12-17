const router = require('express').Router()

router.get('/', function(req, res, next) {
  res.status(200).json({
    message : 'This is API index route',
    data : 'OK'
  })
})


module.exports = router

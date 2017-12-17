const router = require('express').Router()

const {
  getPlural,
  getSingular,
  createSingular,
  updateSingular,
  deleteSingular,
} = require('../controllers/singular')

router.get('/', getPlural)
router.post('/', createSingular)
router.get('/:id', getSingular)
router.put('/:id', updateSingular)
router.delete('/:id',deleteSingular)

module.exports = router
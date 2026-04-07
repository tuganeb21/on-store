const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload   = require('../middleware/upload');

const setFolder = (folder) => (req, res, next) => { req.uploadFolder = folder; next(); };

router.get('/',         ctrl.getProducts);
router.get('/mine',
  authenticate, authorize('seller'),
  ctrl.getMyProducts
);
router.get('/:slug',    ctrl.getProduct);

router.post('/',
  authenticate, authorize('seller'),
  setFolder('products'),
  upload.array('images', 8),
  ctrl.createProduct
);

router.put('/:id',
  authenticate, authorize('seller'),
  setFolder('products'),
  upload.array('images', 8),
  ctrl.updateProduct
);

router.delete('/:id', authenticate, authorize('seller'), ctrl.deleteProduct);

module.exports = router;

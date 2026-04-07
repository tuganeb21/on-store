const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

// ─── ORDERS ───────────────────────────────────────────────────────────────────
const orderRouter = express.Router();
const orderCtrl   = require('../controllers/order.controller');

orderRouter.post('/',          authenticate, authorize('buyer'),  orderCtrl.placeOrder);
orderRouter.get('/',           authenticate, authorize('buyer'),  orderCtrl.getMyOrders);
orderRouter.get('/seller',     authenticate, authorize('seller'), orderCtrl.getSellerOrders);
orderRouter.get('/:id',        authenticate,                      orderCtrl.getOrder);
orderRouter.patch('/:id/cancel', authenticate, authorize('buyer'), orderCtrl.cancelOrder);
orderRouter.patch('/:orderId/items/:itemId/status',
  authenticate, authorize('seller'), orderCtrl.updateItemStatus
);

// ─── CART ─────────────────────────────────────────────────────────────────────
const cartRouter = express.Router();
const cartCtrl   = require('../controllers/cart.controller');

cartRouter.get('/',        authenticate, authorize('buyer'), cartCtrl.getCart);
cartRouter.post('/',       authenticate, authorize('buyer'), cartCtrl.addToCart);
cartRouter.patch('/:id',   authenticate, authorize('buyer'), cartCtrl.updateCartItem);
cartRouter.delete('/',     authenticate, authorize('buyer'), cartCtrl.clearCart);
cartRouter.delete('/:id',  authenticate, authorize('buyer'), cartCtrl.removeFromCart);

// ─── MISC ─────────────────────────────────────────────────────────────────────
const miscCtrl = require('../controllers/misc.controller');
const chatCtrl = require('../controllers/chat.controller');

const reviewRouter = express.Router();
reviewRouter.post('/',                   authenticate, authorize('buyer'), miscCtrl.createReview);
reviewRouter.get('/product/:productId',  miscCtrl.getProductReviews);

const wishlistRouter = express.Router();
wishlistRouter.get('/',   authenticate, authorize('buyer'), miscCtrl.getWishlist);
wishlistRouter.post('/',  authenticate, authorize('buyer'), miscCtrl.toggleWishlist);

const categoryRouter = express.Router();
categoryRouter.get('/',    miscCtrl.getCategories);
categoryRouter.post('/',   authenticate, authorize('admin'), miscCtrl.createCategory);
categoryRouter.put('/:id', authenticate, authorize('admin'), miscCtrl.updateCategory);
categoryRouter.delete('/:id', authenticate, authorize('admin'), miscCtrl.deleteCategory);

const notifRouter = express.Router();
notifRouter.get('/',             authenticate, miscCtrl.getNotifications);
notifRouter.patch('/read-all',   authenticate, miscCtrl.markAllRead);

const analyticsRouter = express.Router();
analyticsRouter.get('/seller',   authenticate, authorize('seller'), miscCtrl.getSellerAnalytics);

const chatRouter = express.Router();
chatRouter.get('/rooms', authenticate, chatCtrl.getMyRooms);

module.exports = {
  orderRouter, cartRouter, reviewRouter, wishlistRouter,
  categoryRouter, notifRouter, analyticsRouter, chatRouter,
};

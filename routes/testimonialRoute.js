const express = require('express');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/testimonialController');

const router = express.Router();

router.use(authenticate);

router.get('/settings', controller.getSettings);
router.post('/settings', controller.upsertSettings);

router.get('/analytics', controller.getAnalytics);
router.get('/search', controller.searchTestimonials);
router.get('/export', controller.exportTestimonials);
router.post('/bulk/status', controller.bulkUpdateStatus);

router.post('/', controller.createTestimonial);
router.get('/', controller.listTestimonials);

router.get('/:testimonialId', controller.getTestimonial);
router.put('/:testimonialId', controller.updateTestimonial);
router.patch('/:testimonialId/status', controller.updateTestimonialStatus);
router.delete('/:testimonialId', controller.deleteTestimonial);
router.post('/:testimonialId/share', controller.shareTestimonial);

module.exports = router;

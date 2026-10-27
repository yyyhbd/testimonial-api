const { v4: uuidv4 } = require('uuid');
const Testimonial = require('../models/testimonial');
const TestimonialSettings = require('../models/testimonialSettings');
const { success, failure, handleError } = require('../lib/response');
const {
  TESTIMONIAL_STATUSES,
  SHARE_CHANNELS,
  SORT_FIELDS,
  DEFAULTS,
} = require('../lib/constants');
const {
  isValidTransition,
  escapeRegex,
  parsePagination,
  parseDateParam,
  parseNumberParam,
  validateTestimonialInput,
  validateSettingsInput,
} = require('../lib/validators');

const CSV_COLUMNS = [
  'testimonialId',
  'customerName',
  'customerEmail',
  'customerPhone',
  'videoUrl',
  'rating',
  'text',
  'status',
  'consentGiven',
  'sharedAt',
  'sharedChannels',
  'createdAt',
  'updatedAt',
];

const SHAREABLE_STATUSES = ['completed', 'shared'];

const serialize = (doc) => {
  const object = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete object._id;
  delete object.__v;
  return object;
};

const findOwnedTestimonial = async (req, res) => {
  const testimonial = await Testimonial.findOne({
    testimonialId: req.params.testimonialId,
    isDeleted: false,
  });

  if (!testimonial) {
    failure(res, 404, 'Testimonial not found');
    return null;
  }

  if (testimonial.userId !== req.user.userId) {
    failure(res, 403, 'You do not have access to this testimonial');
    return null;
  }

  return testimonial;
};

const applyStatusChange = (testimonial, status) => {
  testimonial.status = status;
  if (status === 'shared') {
    testimonial.sharedAt = new Date();
  }
};

const buildListQuery = (query, userId) => {
  const filter = { userId, isDeleted: false };

  if (query.status !== undefined) {
    if (!TESTIMONIAL_STATUSES.includes(query.status)) {
      return { error: `status must be one of: ${TESTIMONIAL_STATUSES.join(', ')}` };
    }
    filter.status = query.status;
  }

  const sortField = query.sort === undefined ? 'createdAt' : query.sort;
  if (!SORT_FIELDS.includes(sortField)) {
    return { error: `sort must be one of: ${SORT_FIELDS.join(', ')}` };
  }

  if (query.order !== undefined && !['asc', 'desc'].includes(query.order)) {
    return { error: 'order must be "asc" or "desc"' };
  }
  const direction = query.order === 'asc' ? 1 : -1;

  return { filter, sort: { [sortField]: direction, _id: direction } };
};

const sendPaginatedList = async (res, filter, sort, page, limit) => {
  const [items, total] = await Promise.all([
    Testimonial.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-_id -__v')
      .lean(),
    Testimonial.countDocuments(filter),
  ]);

  return success(res, 200, 'Data retrieved successfully', items, {
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};

const createTestimonial = async (req, res) => {
  try {
    const { errors, values } = validateTestimonialInput(req.body || {}, { requireName: true });
    if (errors.length) {
      return failure(res, 400, errors.join('; '));
    }

    const testimonial = await Testimonial.create({
      ...values,
      testimonialId: uuidv4(),
      userId: req.user.userId,
      status: 'draft',
    });

    return success(res, 201, 'Testimonial created successfully', serialize(testimonial));
  } catch (err) {
    return handleError(res, err, 'testimonial.create');
  }
};

const listTestimonials = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    if (pagination.error) {
      return failure(res, 400, pagination.error);
    }

    const listQuery = buildListQuery(req.query, req.user.userId);
    if (listQuery.error) {
      return failure(res, 400, listQuery.error);
    }

    return await sendPaginatedList(res, listQuery.filter, listQuery.sort, pagination.page, pagination.limit);
  } catch (err) {
    return handleError(res, err, 'testimonial.list');
  }
};

const getTestimonial = async (req, res) => {
  try {
    const testimonial = await findOwnedTestimonial(req, res);
    if (!testimonial) {
      return null;
    }

    return success(res, 200, 'Data retrieved successfully', serialize(testimonial));
  } catch (err) {
    return handleError(res, err, 'testimonial.get');
  }
};

const updateTestimonial = async (req, res) => {
  try {
    const testimonial = await findOwnedTestimonial(req, res);
    if (!testimonial) {
      return null;
    }

    const { errors, values } = validateTestimonialInput(req.body || {}, { requireName: false });
    if (errors.length) {
      return failure(res, 400, errors.join('; '));
    }

    if (Object.keys(values).length === 0) {
      return failure(
        res,
        400,
        'No valid fields to update. Allowed: customerName, customerEmail, customerPhone, videoUrl, rating, text, consentGiven'
      );
    }

    testimonial.set(values);
    await testimonial.save();

    return success(res, 200, 'Testimonial updated successfully', serialize(testimonial));
  } catch (err) {
    return handleError(res, err, 'testimonial.update');
  }
};

const updateTestimonialStatus = async (req, res) => {
  try {
    const testimonial = await findOwnedTestimonial(req, res);
    if (!testimonial) {
      return null;
    }

    const { status } = req.body || {};
    if (!TESTIMONIAL_STATUSES.includes(status)) {
      return failure(res, 400, `status is required and must be one of: ${TESTIMONIAL_STATUSES.join(', ')}`);
    }

    if (!isValidTransition(testimonial.status, status)) {
      return failure(res, 400, `Cannot transition from ${testimonial.status} to ${status}`);
    }

    applyStatusChange(testimonial, status);
    await testimonial.save();

    return success(res, 200, 'Testimonial status updated successfully', serialize(testimonial));
  } catch (err) {
    return handleError(res, err, 'testimonial.updateStatus');
  }
};

const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await findOwnedTestimonial(req, res);
    if (!testimonial) {
      return null;
    }

    testimonial.isDeleted = true;
    testimonial.deletedAt = new Date();
    await testimonial.save();

    return success(res, 200, 'Testimonial deleted successfully', { testimonialId: testimonial.testimonialId });
  } catch (err) {
    return handleError(res, err, 'testimonial.delete');
  }
};

const shareTestimonial = async (req, res) => {
  try {
    const testimonial = await findOwnedTestimonial(req, res);
    if (!testimonial) {
      return null;
    }

    const { channels } = req.body || {};
    if (!Array.isArray(channels) || channels.length === 0) {
      return failure(res, 400, 'channels is required and must be a non-empty array');
    }

    const invalidChannels = channels.filter((channel) => !SHARE_CHANNELS.includes(channel));
    if (invalidChannels.length) {
      return failure(
        res,
        400,
        `Invalid channels: ${invalidChannels.join(', ')}. Allowed: ${SHARE_CHANNELS.join(', ')}`
      );
    }

    if (!SHAREABLE_STATUSES.includes(testimonial.status)) {
      return failure(
        res,
        400,
        `Cannot share a testimonial with status "${testimonial.status}". It must be completed first`
      );
    }

    testimonial.sharedChannels = [...new Set([...testimonial.sharedChannels, ...channels])];

    if (testimonial.status === 'completed') {
      testimonial.status = 'shared';
    }
    if (!testimonial.sharedAt) {
      testimonial.sharedAt = new Date();
    }

    await testimonial.save();

    return success(res, 200, 'Testimonial shared successfully', serialize(testimonial));
  } catch (err) {
    return handleError(res, err, 'testimonial.share');
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await TestimonialSettings.findOne({ userId: req.user.userId }).lean();

    return success(res, 200, 'Data retrieved successfully', settings ? serialize(settings) : null);
  } catch (err) {
    return handleError(res, err, 'settings.get');
  }
};

const upsertSettings = async (req, res) => {
  try {
    const { errors, updates } = validateSettingsInput(req.body || {});
    if (errors.length) {
      return failure(res, 400, errors.join('; '));
    }

    const settings = await TestimonialSettings.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updates },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return success(res, 200, 'Settings saved successfully', serialize(settings));
  } catch (err) {
    return handleError(res, err, 'settings.upsert');
  }
};

const getAnalytics = async (req, res) => {
  try {
    const start = parseDateParam(req.query.startDate, 'startDate');
    if (start.error) {
      return failure(res, 400, start.error);
    }

    const end = parseDateParam(req.query.endDate, 'endDate', { endOfDay: true });
    if (end.error) {
      return failure(res, 400, end.error);
    }

    if (start.value && end.value && start.value > end.value) {
      return failure(res, 400, 'startDate must not be later than endDate');
    }

    const match = { userId: req.user.userId, isDeleted: false };
    if (start.value || end.value) {
      match.createdAt = {};
      if (start.value) match.createdAt.$gte = start.value;
      if (end.value) match.createdAt.$lte = end.value;
    }

    const [result] = await Testimonial.aggregate([
      { $match: match },
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          ratings: [{ $group: { _id: null, average: { $avg: '$rating' } } }],
        },
      },
    ]);

    const byStatus = TESTIMONIAL_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
    result.byStatus.forEach((item) => {
      byStatus[item._id] = item.count;
    });

    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
    const average = result.ratings.length ? result.ratings[0].average : null;

    return success(res, 200, 'Data retrieved successfully', {
      overview: {
        total,
        byStatus,
        averageRating: average === null ? null : Math.round(average * 100) / 100,
      },
      period: {
        startDate: start.value ? start.value.toISOString() : null,
        endDate: end.value ? end.value.toISOString() : null,
      },
    });
  } catch (err) {
    return handleError(res, err, 'testimonial.analytics');
  }
};

const searchTestimonials = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    if (pagination.error) {
      return failure(res, 400, pagination.error);
    }

    const listQuery = buildListQuery(req.query, req.user.userId);
    if (listQuery.error) {
      return failure(res, 400, listQuery.error);
    }
    const { filter, sort } = listQuery;

    if (req.query.q !== undefined) {
      if (typeof req.query.q !== 'string' || req.query.q.trim() === '' || req.query.q.length > 100) {
        return failure(res, 400, 'q must be a non-empty string up to 100 characters');
      }
      const pattern = new RegExp(escapeRegex(req.query.q.trim()), 'i');
      filter.$or = [{ customerName: pattern }, { text: pattern }];
    }

    const createdAfter = parseDateParam(req.query.createdAfter, 'createdAfter');
    if (createdAfter.error) {
      return failure(res, 400, createdAfter.error);
    }
    const createdBefore = parseDateParam(req.query.createdBefore, 'createdBefore', { endOfDay: true });
    if (createdBefore.error) {
      return failure(res, 400, createdBefore.error);
    }
    if (createdAfter.value || createdBefore.value) {
      filter.createdAt = {};
      if (createdAfter.value) filter.createdAt.$gte = createdAfter.value;
      if (createdBefore.value) filter.createdAt.$lte = createdBefore.value;
    }

    const minRating = parseNumberParam(req.query.minRating, 'minRating');
    if (minRating.error) {
      return failure(res, 400, minRating.error);
    }
    const maxRating = parseNumberParam(req.query.maxRating, 'maxRating');
    if (maxRating.error) {
      return failure(res, 400, maxRating.error);
    }
    if (minRating.value !== null && maxRating.value !== null && minRating.value > maxRating.value) {
      return failure(res, 400, 'minRating must not be greater than maxRating');
    }
    if (minRating.value !== null || maxRating.value !== null) {
      filter.rating = {};
      if (minRating.value !== null) filter.rating.$gte = minRating.value;
      if (maxRating.value !== null) filter.rating.$lte = maxRating.value;
    }

    return await sendPaginatedList(res, filter, sort, pagination.page, pagination.limit);
  } catch (err) {
    return handleError(res, err, 'testimonial.search');
  }
};

const toCsvCell = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  let text;
  if (value instanceof Date) {
    text = value.toISOString();
  } else if (Array.isArray(value)) {
    text = value.join('; ');
  } else {
    text = String(value);
  }

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const exportTestimonials = async (req, res) => {
  try {
    const listQuery = buildListQuery(req.query, req.user.userId);
    if (listQuery.error) {
      return failure(res, 400, listQuery.error);
    }

    const testimonials = await Testimonial.find(listQuery.filter).sort(listQuery.sort).lean();

    const rows = testimonials.map((item) => CSV_COLUMNS.map((column) => toCsvCell(item[column])).join(','));
    const csv = `\uFEFF${[CSV_COLUMNS.join(','), ...rows].join('\r\n')}\r\n`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="testimonials.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    return handleError(res, err, 'testimonial.export');
  }
};

const bulkUpdateStatus = async (req, res) => {
  try {
    const { testimonialIds, status } = req.body || {};

    if (
      !Array.isArray(testimonialIds) ||
      testimonialIds.length === 0 ||
      !testimonialIds.every((id) => typeof id === 'string' && id.length > 0)
    ) {
      return failure(res, 400, 'testimonialIds must be a non-empty array of strings');
    }

    if (testimonialIds.length > DEFAULTS.MAX_BULK_IDS) {
      return failure(res, 400, `testimonialIds must contain at most ${DEFAULTS.MAX_BULK_IDS} items`);
    }

    if (!TESTIMONIAL_STATUSES.includes(status)) {
      return failure(res, 400, `status is required and must be one of: ${TESTIMONIAL_STATUSES.join(', ')}`);
    }

    const uniqueIds = [...new Set(testimonialIds)];
    const testimonials = await Testimonial.find({
      testimonialId: { $in: uniqueIds },
      isDeleted: false,
    });
    const byId = new Map(testimonials.map((item) => [item.testimonialId, item]));

    let updated = 0;
    const errors = [];

    for (const testimonialId of uniqueIds) {
      const testimonial = byId.get(testimonialId);

      if (!testimonial) {
        errors.push({ testimonialId, message: 'Testimonial not found' });
      } else if (testimonial.userId !== req.user.userId) {
        errors.push({ testimonialId, message: 'You do not have access to this testimonial' });
      } else if (!isValidTransition(testimonial.status, status)) {
        errors.push({ testimonialId, message: `Cannot transition from ${testimonial.status} to ${status}` });
      } else {
        applyStatusChange(testimonial, status);
        await testimonial.save();
        updated += 1;
      }
    }

    return success(res, 200, 'Bulk status update processed', {
      updated,
      failed: errors.length,
      errors,
    });
  } catch (err) {
    return handleError(res, err, 'testimonial.bulkStatus');
  }
};

module.exports = {
  createTestimonial,
  listTestimonials,
  getTestimonial,
  updateTestimonial,
  updateTestimonialStatus,
  deleteTestimonial,
  shareTestimonial,
  getSettings,
  upsertSettings,
  getAnalytics,
  searchTestimonials,
  exportTestimonials,
  bulkUpdateStatus,
};

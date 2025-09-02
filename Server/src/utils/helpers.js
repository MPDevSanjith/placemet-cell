const createPaginationResponse = (items, total, page, limit) => {
  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1
  }
}

module.exports = { createPaginationResponse }



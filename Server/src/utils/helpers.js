// utils/helpers.js
export const createPaginationResponse = (items, total, page, limit) => {
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

export default {
  createPaginationResponse
}
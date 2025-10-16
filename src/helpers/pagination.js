
export const preparePagination = (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    return { page: offset, limit: parseInt(limit, 10) };
  };
  


export const getTotalPages = (totalEvents, countPerPage) => {
    return Math.ceil(totalEvents / countPerPage);
  };
  
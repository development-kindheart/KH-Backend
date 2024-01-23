async function paginate(model, query, aggregationStages, page) {
  const perPage = 10;
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(perPage) || 10;

  const startIndex = (currentPage - 1) * itemsPerPage;

  // Determine whether to use aggregation or simple find query
  let countQuery;
  let dataQuery;

  if (aggregationStages && aggregationStages.length > 0) {
    // Use aggregation if aggregation stages are provided
    const aggregationPipeline = [
      ...aggregationStages,
      { $skip: startIndex },
      { $limit: itemsPerPage },
    ];

    countQuery = model.aggregate([...aggregationStages, { $count: "count" }]);
    dataQuery = model.aggregate(aggregationPipeline);
  } else {
    // Use a simple find query if no aggregation stages are provided
    countQuery = model.countDocuments(query);
    dataQuery = model.find(query).skip(startIndex).limit(itemsPerPage);
  }

  // Execute the count and data queries
  const [total, data] = await Promise.all([countQuery, dataQuery]);

  const totalPages = Math.ceil(total / itemsPerPage);

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    total,
    data,
  };
}

module.exports = paginate;

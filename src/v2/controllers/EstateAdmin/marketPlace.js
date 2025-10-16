import MarketProduct from "../../../models/marketPlaceProduct.js";
export const adminGetAllProducts = async (req, res) => {
  const { clanId } = req.params;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await MarketProduct.find({ clanId })
      .populate("seller", "name")
      .skip(skip)
      .limit(limit)
      .sort("-createdAt");

    const productCount = products.length;

    const totalPages =
      productCount > limit ? Math.ceil(productCount / limit) : 1;

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages,
      productCount: productCount,
      products,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};
export const UpdateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { productId } = req.params;
    if (!status) {
      return res
        .status(422)
        .json({ success: false, message: "Status is required." });
    }
    const product = await MarketProduct.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.status = status;

    await product.save();

    res.status(200).json({
      success: true,
      message: `Product "${productId}" status updated successfully`,
      status: status ? status : product.status,
    });
  } catch (err) {
    console.error("Error updating product's status:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to update product's status",
      error: err.message,
    });
  }
};

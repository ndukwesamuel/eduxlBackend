import MarketProduct from "../models/marketPlaceProduct.js";
import MarketProductCategory from "../models/marketProductCategory.js";
import slugify from "slugify";

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json("Name is required");
    }

    const existingCategory = await MarketProductCategory.findOne({ name });
    if (existingCategory) {
      return res.status(401).json({ error: "Market Category already exists" });
    }

    const category = await new MarketProductCategory({
      name,
      slug: slugify(name),
    }).save();

    res.json({
      success: true,
      message: "Market Category created successfully",
      category,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      errMsg: err.message,
    });
  }
};

// export const updateCategory = async (req, res) => {
//   try {
//     const { name } = req.body;
//     const { categoryId } = req.params;

//     // Check if another category with the same name exists
//     const existingCategory = await MarketProductCategory.findOne({
//       name: name,
//       _id: { $ne: categoryId },
//     });

//     if (existingCategory) {
//       return res
//         .status(400)
//         .json({ error: `Category "${name}" already exist` });
//     }
//     const category = await MarketProductCategory.findByIdAndUpdate(
//       categoryId,
//       {
//         name,
//         slug: slugify(name),
//       },
//       { new: true }
//     );

//     res.json(category);
//   } catch (err) {
//     console.log(err);
//     return res.status(400).json(err.message);
//   }
// };

export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    const category = await MarketProductCategory.findById(categoryId);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    category.name = name || category.name;

    if (name) {
      const nameSlug = slugify(name);
      category.slug = nameSlug || category.slug;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: `Category "${category._id}" updated successfully`,
      category,
    });
  } catch (err) {
    console.error("Error updating product:", err.message);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: err.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const removed = await MarketProductCategory.findByIdAndDelete(categoryId);
    res.json({
      success: true,
      message: `Category "${categoryId}" deleted successfully`,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const getAllCategory = async (req, res) => {
  try {
    const categories = await MarketProductCategory.find({}).sort({
      createdAt: -1,
    }); // Sort by createdAt field in descending order
    res.json(categories);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await MarketProductCategory.findOne(slug);
    res.json(category);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const productsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await MarketProductCategory.findOne(slug);
    const products = await MarketProduct.find({ category })
      .populate("category")
      .sort({ createdAt: -1 }); // Sort by createdAt field in descending order

    res.json({
      category,
      products,
    });
  } catch (err) {
    console.log(err);
  }
};

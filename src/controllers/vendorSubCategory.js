import VendorCategory from "../models/vendorSubCategory.js";
import Vendor from "../models/serviceVendor.js";
import slugify from "slugify";

export const createVendorSubCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json("Name is required");
    }

    const existingCategory = await VendorCategory.findOne({ name });
    if (existingCategory) {
      return res
        .status(401)
        .json({ error: "Subvendor Category already exists" });
    }

    const category = await new VendorCategory({
      name,
      slug: slugify(name),
    }).save();

    res.json({
      success: true,
      message: "Subvendor Category created successfully",
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

export const updateVendorSubCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const { categoryId } = req.params;

    // Check if another category with the same name exists
    const existingCategory = await VendorCategory.findOne({
      name: name,
      _id: { $ne: categoryId },
    });

    const cat = await VendorCategory.findById(categoryId);
    if (!cat) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    if (existingCategory) {
      return res
        .status(400)
        .json({ error: "Vendor Category with this name already exists" });
    }
    const category = await VendorCategory.findByIdAndUpdate(
      categoryId,
      {
        name,
        slug: name ? slugify(name) : cat.slug,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "SubCategory updated successfully",
      category,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const deleteVendorSubCategory = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const removed = await VendorCategory.findByIdAndDelete(categoryId);
    res.json(removed);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const getAllVendorSubCategories = async (req, res) => {
  try {
    const categories = await VendorCategory.find({});
    res.json(categories);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const getSubCategoryBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const category = await VendorCategory.findOne({ slug });
    res.json(category);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const getVendorsBySubCategory = async (req, res) => {
  const { slug } = req.params;
  try {
    const category = await VendorCategory.findOne({ slug });
    const vendors = await Vendor.find({ category }).populate("category");

    res.json({
      category,
      vendors,
    });
  } catch (err) {
    console.log(err);
  }
};

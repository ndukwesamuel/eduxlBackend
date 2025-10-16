import VendorCategory from "../models/vendorCategory.js";
import Vendor from "../models/serviceVendor.js";
import slugify from "slugify";

export const createVendorCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json("Name is required");
    }

    const existingCategory = await VendorCategory.findOne({ name });
    if (existingCategory) {
      return res.status(401).json({ error: "Vendor Category already exists" });
    }

    const category = await new VendorCategory({
      name,
      slug: slugify(name),
    }).save();

    res.json({
      success: true,
      message: "Vendor Category created successfully",
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

export const updateVendorCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const { categoryId } = req.params;

    // Check if another category with the same name exists
    const existingCategory = await VendorCategory.findOne({
      name: name,
      _id: { $ne: categoryId },
    });

    if (existingCategory) {
      return res
        .status(400)
        .json({ error: "Vendor Category with this name already exists" });
    }

    const cat = await VendorCategory.findById(categoryId);
    if(!cat) {
      return res.status(404).json({success: false, message: "Category not found"})
    }
    const category = await VendorCategory.findByIdAndUpdate(
      categoryId,
      {
        name,
        slug: name ? (slugify(name)) : cat.slug,
      },
      { new: true }
    );

    res.json({success: true, message: "Vendor category updated", category});
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const deleteVendorCategory = async (req, res) => {
  try {
    const removed = await VendorCategory.findByIdAndDelete(
      req.params.categoryId
    );

    if(!removed){
      res.status(404).json({success: false, message: "Category not found", });
    }
    res.status(200).json({success: true, message: "Deleted vendor category successfully."});
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const getAllVendorCategories = async (req, res) => {
  try {
    const categories = await VendorCategory.find({});
    res.json(categories);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const getVendorCategoryBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const category = await VendorCategory.findOne({ slug });
    res.json(category);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const getVendorsByCategory = async (req, res) => {
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

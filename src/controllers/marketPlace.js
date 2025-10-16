// import cloudinary from "../helpers/cloudinaryConfig.js";
import MarketProduct from "../models/marketPlaceProduct.js";
// import { cloudinary } from "../helpers/cloudinaryConfig.js";
import UserProfile from "../models/profile.js";

// cloudinary
import slugify from "slugify";

import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary - add this at the beginning of your file
cloudinary.config({
  cloud_name: "dkzds0azx", // process.env.CLOUDINARY_CLOUD_NAME,
  api_key: "617445194715168", //process.env.CLOUDINARY_API_KEY,
  api_secret: "fMHpeO7b71XuQEDRB9_idWRR3Qk", // process.env.CLOUDINARY_API_SECRET,
});

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, contact } = req.body;
    const userId = req.user._id;
    const clanId = req.clan?._id;

    // Validation checks
    if (!userId) {
      return res.status(400).json({ error: "UserId is required" });
    }
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }
    if (!price) {
      return res.status(400).json({ error: "Price is required" });
    }

    // Debug Cloudinary status
    console.log("Cloudinary config in handler:", {
      isConfigured: !!cloudinary.config().cloud_name,
      configFields: Object.keys(cloudinary.config()),
    });

    const slug = slugify(name);
    let uploadedImages = [];

    // Check if files exist in the request
    console.log("Files in request:", req.files);

    // Handle image uploads - but first check if we have files
    if (!req.files || !Object.keys(req.files).length) {
      console.log("No files found in the request");
    } else {
      // Check if images field exists
      if (!req.files.images) {
        console.log("No 'images' field in uploaded files");
        console.log("Available fields:", Object.keys(req.files));
      } else {
        // Get the image files
        const imageFiles = req.files.images;
        // Convert to array if single file
        const filesArray = Array.isArray(imageFiles)
          ? imageFiles
          : [imageFiles];
        console.log(`Found ${filesArray.length} files to upload`);

        // Process each file
        uploadedImages = await Promise.all(
          filesArray.map(async (file) => {
            try {
              console.log(
                `Processing file: ${file.name}, Size: ${file.size}, Type: ${file.mimetype}`
              );
              console.log(`Temp file path: ${file.tempFilePath}`);

              // Verify the file has content
              if (!file.size || file.size === 0) {
                console.error("File has zero size:", file.name);
                return { error: "File has zero size", fileName: file.name };
              }

              // Force cloudinary to recheck its config
              if (!cloudinary.config().cloud_name) {
                console.error("Cloudinary configuration missing or invalid");
                console.log("Environment variables:", {
                  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME
                    ? "Set"
                    : "Not set",
                  API_KEY: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
                  API_SECRET: process.env.CLOUDINARY_API_SECRET
                    ? "Set"
                    : "Not set",
                });
                return {
                  error: "Cloudinary not configured properly",
                  fileName: file.name,
                };
              }

              console.log("Attempting Cloudinary upload...");
              // Upload to cloudinary
              const imageResult = await cloudinary.uploader.upload(
                file.tempFilePath,
                {
                  resource_type: "auto",
                  folder: "market_products",
                }
              );

              console.log(
                `Successfully uploaded ${file.name} to Cloudinary at ${imageResult.secure_url}`
              );
              return {
                url: imageResult.secure_url,
                imagePublicId: imageResult.public_id,
              };
            } catch (err) {
              console.error(`Error uploading file ${file.name}:`, err);
              return {
                error: `Upload failed: ${err.message || "Unknown error"}`,
                fileName: file.name,
                details: err.stack || JSON.stringify(err),
              };
            }
          })
        );
      }
    }

    // Filter successful uploads
    const successfulUploads = uploadedImages.filter((img) => !img.error);

    // Create and save the product
    const newProduct = new MarketProduct({
      name,
      slug,
      description,
      price,
      images: successfulUploads,
      seller: userId,
      clanId,
      contact,
      status: "Approve",
    });

    await newProduct.save();

    // Check for upload errors
    if (uploadedImages.length > 0 && successfulUploads.length === 0) {
      // All uploads failed
      return res.status(500).json({
        success: false,
        message: "Failed to upload images to Cloudinary",
        product: newProduct._id, // Still return product ID as it was created
        errors: uploadedImages.map((img) => ({
          error: img.error,
          fileName: img.fileName,
          details: img.details,
        })),
        cloudinaryConfig: {
          isConfigured: !!cloudinary.config().cloud_name,
          configFields: Object.keys(cloudinary.config()),
          envVars: {
            CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Not set",
            API_KEY: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
            API_SECRET: process.env.CLOUDINARY_API_SECRET ? "Set" : "Not set",
          },
        },
      });
    }

    // Return success response
    res.status(201).json({
      success: true,
      message:
        successfulUploads.length > 0
          ? "Product created successfully with images"
          : "Product created without images",
      data: newProduct,
      // imagesCount: uploadedImages.length,
      // successfulUploads: successfulUploads.length,
      // uploadedImages: successfulUploads,
    });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: err.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const userId = req.user._id;

    const clanId = req.clan?._id;

    res.status(200).json({
      success: true,
      message: `Product ${product._id} updated successfully`,
      product: {
        clanId,
        userId,
      },
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

// export const getAllProducts = async (req, res) => {
//   try {
//     // const clanId
//     // const { clanId } = req.params;
//     const clanId = req.clan?._id;
//     const { status } = req.query;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     if (!clanId) {
//       return res.status(400).json({ error: "ClanId is required" });
//     }

//     const queryConditions = {
//       // isAvailable: true,
//       clanId: clanId,
//       ...(status && { status: { $regex: new RegExp(status, "i") } }),
//     };

//     const products = await MarketProduct.find(queryConditions)
//       .populate("seller")
//       .skip(skip)
//       .limit(limit)
//       .sort("-createdAt");

//     const productCount = products.length;

//     const totalPages =
//       productCount > limit ? Math.ceil(productCount / limit) : 1;

//     res.status(200).json({
//       success: true,
//       currentPage: page,
//       totalPages,
//       productCount: productCount,
//       products,
//     });
//   } catch (err) {
//     console.error("Error fetching all products:", err.message);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch products",
//       error: err.message,
//     });
//   }
// };

export const getAllProducts = async (req, res) => {
  try {
    const clanId = req.clan?._id;
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!clanId) {
      return res.status(400).json({ error: "ClanId is required" });
    }

    // Base query conditions - always filter by clanId
    const queryConditions = {
      clanId: clanId,
    };

    // Only add status filter if not explicitly requesting other statuses
    if (!status) {
      // Default: only show approved products
      queryConditions.status = "Approve";
    } else if (status) {
      // If status is provided in query, use that instead
      queryConditions.status = status;
    }

    const products = await MarketProduct.find(queryConditions)
      .populate("seller")
      .skip(skip)
      .limit(limit)
      .sort("-createdAt");

    // Get total count for pagination
    const totalCount = await MarketProduct.countDocuments(queryConditions);
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages,
      productCount: totalCount,
      products,
    });
  } catch (err) {
    console.error("Error fetching all products:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

export const AdminSeeAllProducts = async (req, res) => {
  try {
    const clanId = req.clan?._id;
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10000000;
    const skip = (page - 1) * limit;

    if (!clanId) {
      return res.status(400).json({ error: "ClanId is required" });
    }

    const queryConditions = {
      clanId: clanId,
    };

    const products = await MarketProduct.find(queryConditions)
      .populate("seller")
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
    console.error("Error fetching all products:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

export const getAllMyProducts = async (req, res) => {
  try {
    let user_id = req.user?._id;
    let clanId = req.clan?._id;

    const queryConditions = {
      // isAvailable: true,
      clanId: clanId,
      seller: user_id,
      // ...(status && { status: { $regex: new RegExp(status, "i") } }),
    };

    const products = await MarketProduct.find(queryConditions)
      // .populate("category")
      .populate("seller")
      // .skip(skip)
      // .limit(limit)
      .sort("-createdAt");

    const productCount = products.length;

    // const totalPages =
    //   productCount > limit ? Math.ceil(productCount / limit) : 1;

    res.status(200).json({
      success: true,
      // currentPage: page,
      // totalPages,
      // productCount: productCount,
      products,
      user_id,
    });
  } catch (err) {
    console.error("Error fetching all products:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await MarketProduct.findById(productId).populate("seller");

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    console.error("Error fetching product by ID:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: err.message,
    });
  }
};

export const getBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await MarketProduct.findOne({ slug }).populate("category");

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (err) {
    console.error("Error fetching product by slug:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: err.message,
    });
  }
};

// Delete product by ID
export const deleteProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await MarketProduct.findByIdAndDelete(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: `Product ID: ${productId} deleted successfully`,
    });
  } catch (err) {
    console.error("Error deleting product by ID:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: err.message,
    });
  }
};

// Search products with pagination
export const searchProduct = async (req, res) => {
  const { keyword } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const searchRegex = new RegExp(keyword, "i");

    const products = await MarketProduct.find({
      $and: [
        { isAvailable: true, status: "Approve" },
        {
          $or: [{ name: searchRegex }, { description: searchRegex }],
        },
      ],
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const productCount = products.length;

    const totalPages =
      productCount > limit ? Math.ceil(productCount / limit) : 1;

    res.json({
      currentPage: page,
      productsFound: productCount,
      totalPages,
      products,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search products",
      errorMsg: error.message,
    });
  }
};

export const relatedProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await MarketProduct.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Find related products based on the category or brand of the provided product
    const relatedProducts = await MarketProduct.find({
      $or: [
        { category: product.category }, // Find by category
        { seller: product.seller }, // Find by seller
      ],
      _id: { $ne: productId },
    })
      .limit(5)
      .populate("category")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, products: relatedProducts });
  } catch (err) {
    console.error("Error fetching related products:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch related products",
      error: err.message,
    });
  }
};

// Update product status
export const UpdateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { productId } = req.params;

    const product = await MarketProduct.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.status = status || product.status;

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

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await MarketProduct.findByIdAndDelete(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: `Product ID: ${productId} deleted successfully`,
    });
  } catch (err) {
    console.error("Error deleting product by ID:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: err.message,
    });
  }
};

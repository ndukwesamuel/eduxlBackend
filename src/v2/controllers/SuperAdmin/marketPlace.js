import Clan from "../../../models/clan.js";
import MarketProduct from "../../../models/marketPlaceProduct.js";

export const getAllClanProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalClans = await Clan.countDocuments({});
    const totalPages = Math.ceil(totalClans / limit);

    const clans = await Clan.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("_id name")
      .lean();

    const clanIds = clans.map((clan) => clan._id);

    const productCounts = await MarketProduct.aggregate([
      {
        $match: {
          clanId: { $in: clanIds },
        },
      },
      {
        $group: {
          _id: "$clanId",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    productCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const result = clans.map((clan) => ({
      clanId: clan._id,
      name: clan.name,
      productCount: countMap[clan._id.toString()] || 0,
    }));

    return res.status(200).json({
      data: result,
      pagination: {
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching estates:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

import Rating from "../models/ratings.js";

export const calculateAverageRating = async () => {
    const ratings = await Rating.find({ "ratings.star": { $exists: true } });
    let totalRating = 0;
    let totalCount = 0;
    ratings.forEach((rating) => {
      rating.ratings.forEach((userRating) => {
        totalRating += userRating.star;
        totalCount++;
      });
    });
    const avgRating = totalCount > 0 ? totalRating / totalCount : 0;
    return avgRating;
  };

  export const calcAvgRating = async (p) => {
    try {
        const totalRatings = p.ratings.length;
        let totalRating = 0;

        if (totalRatings > 0) {
            p.ratings.forEach((rating) => {
                totalRating += rating.rating;
            });

            const avgRating = totalRating / totalRatings;
            return avgRating;
        } else {
            return 0; 
        }
    } catch (error) {
        console.error("Error calculating average rating:", error.message);
        throw error;
    }
};

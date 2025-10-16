import { v2 as cloudinary } from "cloudinary";

export const processItemImages = async (errandData, files) => {
  if (!files || Object.keys(files).length === 0) {
    return errandData;
  }

  const processedData = JSON.parse(JSON.stringify(errandData));

  // Parse pickupLocations from string to array if it's a string
  if (typeof processedData.pickupLocations === "string") {
    try {
      processedData.pickupLocations = JSON.parse(processedData.pickupLocations);
    } catch (error) {
      console.error("Failed to parse pickupLocations JSON:", error);
      throw new Error("Invalid pickupLocations format");
    }
  }

  for (
    let locationIndex = 0;
    locationIndex < processedData.pickupLocations.length;
    locationIndex++
  ) {
    const location = processedData.pickupLocations[locationIndex];

    for (let itemIndex = 0; itemIndex < location.items.length; itemIndex++) {
      const imageKey = `item_${locationIndex}_${itemIndex}_images`;

      if (files[imageKey]) {
        const itemImages = Array.isArray(files[imageKey])
          ? files[imageKey]
          : [files[imageKey]];
        const uploadedUrls = [];

        for (const imageFile of itemImages) {
          try {
            const result = await cloudinary.uploader.upload(
              imageFile.tempFilePath
            );
            uploadedUrls.push(result.secure_url);
          } catch (error) {
            console.error(
              `Failed to upload image for item ${locationIndex}-${itemIndex}:`,
              error
            );
          }
        }

        processedData.pickupLocations[locationIndex].items[itemIndex].images =
          uploadedUrls;
      }
    }
  }

  return processedData;
};

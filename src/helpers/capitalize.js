export const capitalizeWord = (inputString) => {
  // Split the string into an array of words
  const words = inputString.split(" ");

  // Capitalize the first letter of each word
  const capitalizedWords = words.map((word) => {
    if (word.length > 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    } else {
      return word;
    }
  });

  // Join the capitalized words back into a string
  const resultString = capitalizedWords.join(" ");

  return resultString;
};

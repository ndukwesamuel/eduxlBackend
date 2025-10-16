import mongoose from "mongoose";

const oldDB =
  "mongodb+srv://pausepointv1:cu7efbST3J7NOj8y@cluster0.ge0okqh.mongodb.net/test";
const newDB =
  "mongodb+srv://pausepointv1:cu7efbST3J7NOj8y@cluster0.ge0okqh.mongodb.net/MAIN-PAUSE-POINT";

export async function cloneDatabase() {
  try {
    console.log("Connecting to databases...");

    // Connect to the old database
    const oldConnection = mongoose.createConnection(oldDB);
    await oldConnection.asPromise(); // Ensure the connection is ready

    // Connect to the new database
    const newConnection = mongoose.createConnection(newDB);
    await newConnection.asPromise(); // Ensure the connection is ready

    console.log("Fetching collections...");
    const collections = await oldConnection.db.listCollections().toArray();

    for (let collection of collections) {
      const name = collection.name;
      console.log(`Cloning collection: ${name}...`);

      const oldCollection = oldConnection.db.collection(name);
      const newCollection = newConnection.db.collection(name);

      const docs = await oldCollection.find({}).toArray();
      if (docs.length > 0) {
        await newCollection.insertMany(docs);
        console.log(`Copied ${docs.length} documents to ${name}`);
      } else {
        console.log(`No documents found in ${name}, skipping.`);
      }
    }

    console.log("Database cloned successfully!");
    await oldConnection.close();
    await newConnection.close();
  } catch (err) {
    console.error("Error cloning database:", err);
  }
}

import mongoose from "mongoose";

export const syncIndexes = async (req, res) => {
  try {
    const modelNames = mongoose.modelNames(); // Gets all registered model names
    console.log(modelNames);

    for (const name of modelNames) {
      const model = mongoose.model(name);
      await model.syncIndexes();
      console.log(`Synced indexes for model: ${name}`);
    }

    res.status(200).json({ message: "All indexes synced successfully" });
  } catch (error) {
    console.error("Index sync error:", error);
    res
      .status(500)
      .json({ message: "Index sync failed", error: error.message });
  }
};


export const fixAllTransactionIndexes=async()=> {
  try {
    const db = mongoose.connection.db;
    const collections = ['Sale', 'Purchase',"Receipt","Payment"]; // Add all your collection names: ['sales', 'purchases', 'receipts', 'payments']
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      try {
        await collection.dropIndex('transactionNumber_1');
        console.log(`✓ Dropped index from ${collectionName}`);
      } catch (err) {
        if (err.code === 27) { // Index not found
          console.log(`✓ No conflicting index in ${collectionName}`);
        } else {
          throw err;
        }
      }
    }
    
    // Now sync indexes
    await TransactionModel.syncIndexes();
    console.log('✓ All indexes synced successfully');
    
  } catch (error) {
    console.error('Error fixing indexes:', error);
  }
}

await fixAllTransactionIndexes();
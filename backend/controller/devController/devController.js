import mongoose from "mongoose";

export const syncIndexes = async (req, res) => {
  try {
    const modelNames = mongoose.modelNames();
    console.log("All models:", modelNames);

    for (const name of modelNames) {
      if (name === 'User') {
        console.log(`Skipped syncing indexes for model: ${name}`);
        continue;
      }

      console.log(`About to sync model: ${name}`);
      const model = mongoose.model(name);
      
      // Log what indexes this model will create
      console.log(`${name} schema indexes:`, model.schema.indexes());
      
      await model.syncIndexes();
      console.log(`✓ Synced indexes for model: ${name}`);
    }

    res.status(200).json({ message: "All indexes synced successfully" });
  } catch (error) {
    console.error("Index sync error:", error);
    res.status(500).json({ 
      message: "Index sync failed", 
      error: error.message 
    });
  }
};


export const fixAllTransactionIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const collections = ["Sale", "Purchase", "Receipt", "Payment"]; // Add all your collection names: ['sales', 'purchases', 'receipts', 'payments']

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);

      try {
        await collection.dropIndex("transactionNumber_1");
        console.log(`✓ Dropped index from ${collectionName}`);
      } catch (err) {
        if (err.code === 27) {
          // Index not found
          console.log(`✓ No conflicting index in ${collectionName}`);
        } else {
          throw err;
        }
      }
    }

    // Now sync indexes
    await TransactionModel.syncIndexes();
    console.log("✓ All indexes synced successfully");
  } catch (error) {
    console.error("Error fixing indexes:", error);
  }
};

/// to delete all related data;


export const deleteData = async (req, res) => {
  try {
    const { account, company } = req.query;

    const modelNames = [
      "Sale",
      "Purchase",
      "Receipt",
      "Payment",
      "AccountLedger",
      "AccountMonthlyBalance",
      "ItemLedger",
      "ItemMonthlyBalance",
      "CashBankLedger",
      "Outstanding",
      "OutstandingSettlement",
      "AdjustmentEntry",
      "SalesReturn",
      "PurchaseReturn",
      "StockAdjustment",
      "OutstandingOffset",
      "YearOpeningAdjustment",
    ];

    const baseFilter = {};

    if (company) {
      baseFilter.company = new mongoose.Types.ObjectId(company);
    }
    if (account) {
      baseFilter.account = new mongoose.Types.ObjectId(account);
    }

    if (!company && !account) {
      return res.status(400).json({ message: "No filter provided" });
    }

    let totalDeleted = 0;
    let totalReset = 0;
    const results = {};

    for (const modelName of modelNames) {
      try {
        const Model = mongoose.model(modelName);

        if (modelName === "Outstanding") {
          // ── 1. Delete all non-opening_balance records ──────────────────
          const deleteResult = await Model.deleteMany({
            ...baseFilter,
            transactionType: { $ne: "opening_balance" },
          });
          totalDeleted += deleteResult.deletedCount;

          // ── 2. Reset opening_balance records instead of deleting ────────
          const resetResult = await Model.updateMany(
            {
              ...baseFilter,
              transactionType: "opening_balance",
            },
            [
              {
                $set: {
                  paidAmount: 0,
                  closingBalanceAmount: {
                    $cond: {
                      if: { $eq: ["$outstandingType", "cr"] },
                      then: { $multiply: ["$totalAmount", -1] }, // negative for cr
                      else: "$totalAmount",                       // positive for dr
                    },
                  },
                  status: "pending",
                },
              },
            ]
          );

          totalReset += resetResult.modifiedCount;

          results[modelName] = {
            deleted: deleteResult.deletedCount,
            reset: resetResult.modifiedCount,
          };

          console.log(
            `✓ Outstanding — Deleted: ${deleteResult.deletedCount}, Reset opening_balance: ${resetResult.modifiedCount}`
          );
        } else {
          // ── Default: delete everything matching baseFilter ──────────────
          const result = await Model.deleteMany({ ...baseFilter });
          totalDeleted += result.deletedCount;
          results[modelName] = result.deletedCount;

          console.log(`✓ Deleted ${result.deletedCount} from ${modelName}`);
        }
      } catch (err) {
        console.log(`✗ Error processing ${modelName}:`, err.message);
        results[modelName] = `Error: ${err.message}`;
      }
    }

    res.json({
      message: "Data deletion completed",
      filter: {
        company: company || undefined,
        account: account || undefined,
      },
      totalDeleted,
      totalReset,
      details: results,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      message: "Error deleting data",
      error: error.message,
    });
  }
};







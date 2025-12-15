
import OutstandingModel from "../../model/OutstandingModel.js";

import mongoose from "mongoose";

/**
 * Get all customers with outstanding balances
 * @route GET /api/reports/getOutstandingCustomers/:companyId/:branchId
 */
export const getOutstandingCustomers = async (req, res) => {
  try {
    const { companyId, branchId } = req.params;
    const { search, minAmount, accountType = 'customer' } = req.query;

    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // Build match conditions for OutstandingModel collection
    const matchConditions = {
      company: companyObjectId,
      branch: branchObjectId,
      accountType: accountType, // 'customer' or 'supplier'
      status: { $nin: ['paid', 'cancelled', 'written_off'] }
    };

    // Aggregation pipeline
    const outstandingCustomers = await OutstandingModel.aggregate([
      { $match: matchConditions },

      // Lookup account details
      {
        $lookup: {
          from: 'accountmasters',
          localField: 'account',
          foreignField: '_id',
          as: 'accountDetails'
        }
      },
      { $unwind: '$accountDetails' },

      // Search filter
      ...(search ? [{
        $match: {
          $or: [
            { 'accountDetails.accountName': { $regex: search, $options: 'i' } },
            { 'accountDetails.email': { $regex: search, $options: 'i' } },
            { 'accountDetails.phoneNo': { $regex: search, $options: 'i' } },
            { accountName: { $regex: search, $options: 'i' } }
          ]
        }
      }] : []),

      // Calculate days overdue
      {
        $addFields: {
          daysOverdue: {
            $cond: {
              if: { $and: [{ $ne: ['$dueDate', null] }, { $ne: ['$dueDate', undefined] }] },
              then: {
                $divide: [
                  { $subtract: [new Date(), '$dueDate'] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: 0
            }
          }
        }
      },

      // Group by account
      {
        $group: {
          _id: '$account',
          customerId: { $first: '$accountDetails._id' },
          customerName: { $first: '$accountName' },
          customerEmail: { $first: '$accountDetails.email' },
          customerPhone: { $first: '$accountDetails.phoneNo' },
          totalOutstanding: { $sum: '$closingBalanceAmount' },
          totalDr: {
            $sum: {
              $cond: [
                { $eq: ['$outstandingType', 'dr'] },
                '$closingBalanceAmount',
                0
              ]
            }
          },
          totalCr: {
            $sum: {
              $cond: [
                { $eq: ['$outstandingType', 'cr'] },
                '$closingBalanceAmount',
                0
              ]
            }
          },
          transactionCount: { $sum: 1 },
          oldestTransactionDate: { $min: '$transactionDate' },
          newestTransactionDate: { $max: '$transactionDate' },
          maxDaysOverdue: { $max: '$daysOverdue' },
          
          // Collect all outstanding transactions
          transactions: {
            $push: {
              transactionId: '$_id',
              transactionNumber: '$transactionNumber',
              transactionDate: '$transactionDate',
              transactionType: '$transactionType',
              dueDate: '$dueDate',
              totalAmount: '$totalAmount',
              paidAmount: '$paidAmount',
              closingBalanceAmount: '$closingBalanceAmount',
              outstandingType: '$outstandingType',
              daysOverdue: '$daysOverdue',
              status: '$status'
            }
          }
        }
      },

      // Filter by minimum amount if provided
      ...(minAmount ? [{
        $match: {
          totalOutstanding: { $gte: parseFloat(minAmount) }
        }
      }] : []),

      // Calculate aging buckets
      {
        $addFields: {
          aging: {
            current: {
              $sum: {
                $map: {
                  input: '$transactions',
                  as: 'txn',
                  in: {
                    $cond: [
                      { $lte: ['$$txn.daysOverdue', 0] },
                      '$$txn.closingBalanceAmount',
                      0
                    ]
                  }
                }
              }
            },
            days1_30: {
              $sum: {
                $map: {
                  input: '$transactions',
                  as: 'txn',
                  in: {
                    $cond: [
                      {
                        $and: [
                          { $gt: ['$$txn.daysOverdue', 0] },
                          { $lte: ['$$txn.daysOverdue', 30] }
                        ]
                      },
                      '$$txn.closingBalanceAmount',
                      0
                    ]
                  }
                }
              }
            },
            days31_60: {
              $sum: {
                $map: {
                  input: '$transactions',
                  as: 'txn',
                  in: {
                    $cond: [
                      {
                        $and: [
                          { $gt: ['$$txn.daysOverdue', 30] },
                          { $lte: ['$$txn.daysOverdue', 60] }
                        ]
                      },
                      '$$txn.closingBalanceAmount',
                      0
                    ]
                  }
                }
              }
            },
            days61_90: {
              $sum: {
                $map: {
                  input: '$transactions',
                  as: 'txn',
                  in: {
                    $cond: [
                      {
                        $and: [
                          { $gt: ['$$txn.daysOverdue', 60] },
                          { $lte: ['$$txn.daysOverdue', 90] }
                        ]
                      },
                      '$$txn.closingBalanceAmount',
                      0
                    ]
                  }
                }
              }
            },
            days90Plus: {
              $sum: {
                $map: {
                  input: '$transactions',
                  as: 'txn',
                  in: {
                    $cond: [
                      { $gt: ['$$txn.daysOverdue', 90] },
                      '$$txn.closingBalanceAmount',
                      0
                    ]
                  }
                }
              }
            }
          }
        }
      },

      // Sort by absolute outstanding amount (highest first)
      { 
        $sort: { 
          totalOutstanding: -1 
        } 
      },

      // Project final output
      {
        $project: {
          _id: 0,
          customerId: 1,
          customerName: 1,
          customerEmail: 1,
          customerPhone: 1,
          totalOutstanding: { $round: ['$totalOutstanding', 2] },
          totalDr: { $round: ['$totalDr', 2] },
          totalCr: { $round: ['$totalCr', 2] },
          netOutstanding: { $round: [{ $add: ['$totalDr', '$totalCr'] }, 2] },
          transactionCount: 1,
          oldestTransactionDate: 1,
          newestTransactionDate: 1,
          maxDaysOverdue: { $round: ['$maxDaysOverdue', 0] },
          aging: {
            current: { $round: ['$aging.current', 2] },
            days1_30: { $round: ['$aging.days1_30', 2] },
            days31_60: { $round: ['$aging.days31_60', 2] },
            days61_90: { $round: ['$aging.days61_90', 2] },
            days90Plus: { $round: ['$aging.days90Plus', 2] }
          },
          transactions: {
            $map: {
              input: '$transactions',
              as: 'txn',
              in: {
                transactionId: '$$txn.transactionId',
                transactionNumber: '$$txn.transactionNumber',
                transactionDate: '$$txn.transactionDate',
                transactionType: '$$txn.transactionType',
                dueDate: '$$txn.dueDate',
                totalAmount: { $round: ['$$txn.totalAmount', 2] },
                paidAmount: { $round: ['$$txn.paidAmount', 2] },
                closingBalanceAmount: { $round: ['$$txn.closingBalanceAmount', 2] },
                outstandingType: '$$txn.outstandingType',
                daysOverdue: { $round: ['$$txn.daysOverdue', 0] },
                status: '$$txn.status'
              }
            }
          }
        }
      }
    ]);

    // Calculate summary totals
    const summary = {
      totalCustomers: outstandingCustomers.length,
      totalOutstandingAmount: outstandingCustomers.reduce(
        (sum, customer) => sum + customer.totalOutstanding,
        0
      ),
      totalDrAmount: outstandingCustomers.reduce(
        (sum, customer) => sum + customer.totalDr,
        0
      ),
      totalCrAmount: outstandingCustomers.reduce(
        (sum, customer) => sum + customer.totalCr,
        0
      ),
      totalTransactions: outstandingCustomers.reduce(
        (sum, customer) => sum + customer.transactionCount,
        0
      ),
      agingSummary: {
        current: outstandingCustomers.reduce(
          (sum, customer) => sum + customer.aging.current,
          0
        ),
        days1_30: outstandingCustomers.reduce(
          (sum, customer) => sum + customer.aging.days1_30,
          0
        ),
        days31_60: outstandingCustomers.reduce(
          (sum, customer) => sum + customer.aging.days31_60,
          0
        ),
        days61_90: outstandingCustomers.reduce(
          (sum, customer) => sum + customer.aging.days61_90,
          0
        ),
        days90Plus: outstandingCustomers.reduce(
          (sum, customer) => sum + customer.aging.days90Plus,
          0
        )
      }
    };

    res.status(200).json({
      success: true,
      data: {
        customers: outstandingCustomers,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching outstanding customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outstanding customers',
      error: error.message
    });
  }
};

/**
 * Get outstanding details for a specific customer
 * @route GET /api/reports/getCustomerOutstandingDetails/:companyId/:branchId/:customerId
 */
export const getCustomerOutstandingDetails = async (req, res) => {
  try {
    const { companyId, branchId, customerId } = req.params;
    const { outstandingType } = req.query; // 'dr', 'cr', or undefined for all

    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const branchObjectId = new mongoose.Types.ObjectId(branchId);
    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    const matchConditions = {
      company: companyObjectId,
      branch: branchObjectId,
      account: customerObjectId,
      status: { $nin: ['paid', 'cancelled', 'written_off'] }
    };

    // Add outstanding type filter if provided
    if (outstandingType && ['dr', 'cr'].includes(outstandingType)) {
      matchConditions.outstandingType = outstandingType;
    }

    const customerOutstanding = await OutstandingModel.aggregate([
      { $match: matchConditions },

      // Lookup account details
      {
        $lookup: {
          from: 'accountmasters',
          localField: 'account',
          foreignField: '_id',
          as: 'accountDetails'
        }
      },
      { $unwind: '$accountDetails' },

      // Calculate days overdue
      {
        $addFields: {
          daysOverdue: {
            $cond: {
              if: { $and: [{ $ne: ['$dueDate', null] }, { $ne: ['$dueDate', undefined] }] },
              then: {
                $divide: [
                  { $subtract: [new Date(), '$dueDate'] },
                  1000 * 60 * 60 * 24
                ]
              },
              else: 0
            }
          }
        }
      },

      // Sort by transaction date (newest first)
      { $sort: { transactionDate: -1 } },

      {
        $project: {
          transactionId: '$_id',
          transactionNumber: 1,
          transactionDate: 1,
          transactionType: 1,
          dueDate: 1,
          totalAmount: { $round: ['$totalAmount', 2] },
          paidAmount: { $round: ['$paidAmount', 2] },
          closingBalanceAmount: { $round: ['$closingBalanceAmount', 2] },
          outstandingType: 1,
          daysOverdue: { $round: ['$daysOverdue', 0] },
          status: 1,
          notes: 1,
          customerName: '$accountDetails.accountName',
          customerEmail: '$accountDetails.email',
          customerPhone: '$accountDetails.phoneNo'
        }
      }
    ]);

    const totalOutstanding = customerOutstanding.reduce(
      (sum, txn) => sum + txn.closingBalanceAmount,
      0
    );

    const totalDr = customerOutstanding
      .filter(txn => txn.outstandingType === 'dr')
      .reduce((sum, txn) => sum + txn.closingBalanceAmount, 0);

    const totalCr = customerOutstanding
      .filter(txn => txn.outstandingType === 'cr')
      .reduce((sum, txn) => sum + Math.abs(txn.closingBalanceAmount), 0);

    res.status(200).json({
      success: true,
      data: {
        customer: customerOutstanding[0] ? {
          name: customerOutstanding[0].customerName,
          email: customerOutstanding[0].customerEmail,
          phone: customerOutstanding[0].customerPhone
        } : null,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalDr: Math.round(totalDr * 100) / 100,
        totalCr: Math.round(totalCr * 100) / 100,
        netOutstanding: Math.round((totalDr - totalCr) * 100) / 100,
        transactionCount: customerOutstanding.length,
        transactions: customerOutstanding
      }
    });

  } catch (error) {
    console.error('Error fetching customer outstanding details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer outstanding details',
      error: error.message
    });
  }
};

import Outstanding from "../../model/OutstandingModel.js";
import mongoose from "mongoose";


/**
 * Get all customers with outstanding balances
 * @route GET /api/reports/getOutstandingCustomers/:companyId/:branchId
 */


export const getPartyOutstandingDetails = async (req, res) => {
  try {
    const { companyId, branchId, customerId } = req.params;
    const { outstandingType, startDate, endDate, page = 1, limit = 10 } = req.query;



    
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

    // Add date filter
    if (startDate && endDate) {
      matchConditions.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Outstanding.countDocuments(matchConditions);

    const customerOutstanding = await Outstanding.aggregate([
      { $match: matchConditions },

      {
        $lookup: {
          from: 'accountmasters',
          localField: 'account',
          foreignField: '_id',
          as: 'accountDetails'
        }
      },
      { $unwind: '$accountDetails' },

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

      { $sort: { transactionDate: -1 } },
      { $skip: skip },
      { $limit: limitNum },

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

    // Calculate totals without pagination
    const totalsAggregate = await Outstanding.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
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
          }
        }
      }
    ]);

    const totals = totalsAggregate[0] || {
      totalOutstanding: 0,
      totalDr: 0,
      totalCr: 0
    };

    res.status(200).json({
      success: true,
      data: {
        customer: customerOutstanding[0] ? {
          name: customerOutstanding[0].customerName,
          email: customerOutstanding[0].customerEmail,
          phone: customerOutstanding[0].customerPhone
        } : null,
        totalOutstanding: Math.round(totals.totalOutstanding * 100) / 100,
        totalDr: Math.round(totals.totalDr * 100) / 100,
        totalCr: Math.round(Math.abs(totals.totalCr) * 100) / 100,
        netOutstanding: Math.round((totals.totalDr + totals.totalCr) * 100) / 100,
        totalCount: totalCount,
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
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

export const getOutstandingParties = async (req, res) => {
  try {
    const { companyId, branchId } = req.params;
    const { search, minAmount, page = 1, limit = 5 } = req.query;

    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // Calculate pagination values
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const matchConditions = {
      company: companyObjectId,
      branch: branchObjectId,
      status: { $nin: ['paid', 'cancelled', 'written_off'] }
    };

    const outstandingParties = await Outstanding.aggregate([
      { $match: matchConditions },

      {
        $lookup: {
          from: 'accountmasters',
          localField: 'account',
          foreignField: '_id',
          as: 'accountDetails'
        }
      },
      { $unwind: '$accountDetails' },

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

      // {
      //   $addFields: {
      //     daysOverdue: {
      //       $cond: {
      //         if: { $and: [{ $ne: ['$dueDate', null] }, { $ne: ['$dueDate', undefined] }] },
      //         then: {
      //           $divide: [
      //             { $subtract: [new Date(), '$dueDate'] },
      //             1000 * 60 * 60 * 24
      //           ]
      //         },
      //         else: 0
      //       }
      //     }
      //   }
      // },

      // Group by account (party)
      {
        $group: {
          _id: '$account',
          partyId: { $first: '$account' },
          partyName: { $first: '$accountName' },
          partyEmail: { $first: '$accountDetails.email' },
          partyPhone: { $first: '$accountDetails.phoneNo' },
          
          customerOutstanding: {
            $sum: {
              $cond: [
                { $eq: ['$accountType', 'customer'] },
                '$closingBalanceAmount',
                0
              ]
            }
          },
          customerTransactionCount: {
            $sum: {
              $cond: [
                { $eq: ['$accountType', 'customer'] },
                1,
                0
              ]
            }
          },
          
          supplierOutstanding: {
            $sum: {
              $cond: [
                { $eq: ['$accountType', 'supplier'] },
                '$closingBalanceAmount',
                0
              ]
            }
          },
          supplierTransactionCount: {
            $sum: {
              $cond: [
                { $eq: ['$accountType', 'supplier'] },
                1,
                0
              ]
            }
          },
          
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
          // oldestTransactionDate: { $min: '$transactionDate' },
          // newestTransactionDate: { $max: '$transactionDate' },
          // maxDaysOverdue: { $max: '$daysOverdue' },
          accountTypes: { $addToSet: '$accountType' }, // This creates an array
          
          transactions: {
            $push: {
              transactionId: '$_id',
              transactionNumber: '$transactionNumber',
              transactionDate: '$transactionDate',
              transactionType: '$transactionType',
              accountType: '$accountType',
              dueDate: '$dueDate',
              totalAmount: '$totalAmount',
              paidAmount: '$paidAmount',
              closingBalanceAmount: '$closingBalanceAmount',
              outstandingType: '$outstandingType',
              // daysOverdue: '$daysOverdue',
              status: '$status'
            }
          }
        }
      },

      ...(minAmount ? [{
        $match: {
          totalOutstanding: { $gte: parseFloat(minAmount) }
        }
      }] : []),

      {
        $addFields: {
          partyType: {
            $cond: [
              { $gt: [{ $size: '$accountTypes' }, 1] },
              'both',
              { $arrayElemAt: ['$accountTypes', 0] }
            ]
          },
          
          netPositionType: {
            $cond: [
              { $gte: ['$totalOutstanding', 0] },
              'receivable',
              'payable'
            ]
          },
          
          absOutstanding: { $abs: '$totalOutstanding' },
          
          // aging: {
          //   current: {
          //     $sum: {
          //       $map: {
          //         input: '$transactions',
          //         as: 'txn',
          //         in: {
          //           $cond: [
          //             { $lte: ['$$txn.daysOverdue', 0] },
          //             '$$txn.closingBalanceAmount',
          //             0
          //           ]
          //         }
          //       }
          //     }
          //   },
          //   days1_30: {
          //     $sum: {
          //       $map: {
          //         input: '$transactions',
          //         as: 'txn',
          //         in: {
          //           $cond: [
          //             {
          //               $and: [
          //                 { $gt: ['$$txn.daysOverdue', 0] },
          //                 { $lte: ['$$txn.daysOverdue', 30] }
          //               ]
          //             },
          //             '$$txn.closingBalanceAmount',
          //             0
          //           ]
          //         }
          //       }
          //     }
          //   },
          //   days31_60: {
          //     $sum: {
          //       $map: {
          //         input: '$transactions',
          //         as: 'txn',
          //         in: {
          //           $cond: [
          //             {
          //               $and: [
          //                 { $gt: ['$$txn.daysOverdue', 30] },
          //                 { $lte: ['$$txn.daysOverdue', 60] }
          //               ]
          //             },
          //             '$$txn.closingBalanceAmount',
          //             0
          //           ]
          //         }
          //       }
          //     }
          //   },
          //   days61_90: {
          //     $sum: {
          //       $map: {
          //         input: '$transactions',
          //         as: 'txn',
          //         in: {
          //           $cond: [
          //             {
          //               $and: [
          //                 { $gt: ['$$txn.daysOverdue', 60] },
          //                 { $lte: ['$$txn.daysOverdue', 90] }
          //               ]
          //             },
          //             '$$txn.closingBalanceAmount',
          //             0
          //           ]
          //         }
          //       }
          //     }
          //   },
          //   days90Plus: {
          //     $sum: {
          //       $map: {
          //         input: '$transactions',
          //         as: 'txn',
          //         in: {
          //           $cond: [
          //             { $gt: ['$$txn.daysOverdue', 90] },
          //             '$$txn.closingBalanceAmount',
          //             0
          //           ]
          //         }
          //       }
          //     }
          //   }
          // }
        }
      },

      // Facet for pagination - get total count and paginated results
      {
        $facet: {
          metadata: [{ $count: 'totalCount' }],
          data: [
            { $sort: { absOutstanding: -1 } },
            { $skip: skip },
            { $limit: pageSize }
          ]
        }
      }
    ]);

    // Extract results
    const totalCount = outstandingParties[0]?.metadata[0]?.totalCount || 0;
    const parties = outstandingParties[0]?.data || [];

    // Project final shape
    const formattedParties = parties.map(party => ({
      partyId: party.partyId,
      partyName: party.partyName,
      partyEmail: party.partyEmail,
      partyPhone: party.partyPhone,
      partyType: party.partyType,
      netPositionType: party.netPositionType,
      totalOutstanding: Math.round(party.totalOutstanding * 100) / 100,
      customerOutstanding: Math.round(party.customerOutstanding * 100) / 100,
      supplierOutstanding: Math.round(party.supplierOutstanding * 100) / 100,
      customerTransactionCount: party.customerTransactionCount,
      supplierTransactionCount: party.supplierTransactionCount,
      totalDr: Math.round(party.totalDr * 100) / 100,
      totalCr: Math.round(party.totalCr * 100) / 100,
      netOutstanding: Math.round((party.totalDr + party.totalCr) * 100) / 100,
      transactionCount: party.transactionCount,
      // oldestTransactionDate: party.oldestTransactionDate,
      // newestTransactionDate: party.newestTransactionDate,
      // maxDaysOverdue: Math.round(party.maxDaysOverdue),
      // aging: {
      //   current: Math.round(party.aging.current * 100) / 100,
      //   days1_30: Math.round(party.aging.days1_30 * 100) / 100,
      //   days31_60: Math.round(party.aging.days31_60 * 100) / 100,
      //   days61_90: Math.round(party.aging.days61_90 * 100) / 100,
      //   days90Plus: Math.round(party.aging.days90Plus * 100) / 100
      // }
    }));

    // Calculate summary - simpler approach without $setUnion
    const summaryAggregate = await Outstanding.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'accountmasters',
          localField: 'account',
          foreignField: '_id',
          as: 'accountDetails'
        }
      },
      { $unwind: '$accountDetails' },
      {
        $group: {
          _id: '$account',
          accountTypes: { $addToSet: '$accountType' }, // Creates array of unique account types
          totalOutstanding: { $sum: '$closingBalanceAmount' },
          customerOutstanding: {
            $sum: {
              $cond: [{ $eq: ['$accountType', 'customer'] }, '$closingBalanceAmount', 0]
            }
          },
          supplierOutstanding: {
            $sum: {
              $cond: [{ $eq: ['$accountType', 'supplier'] }, '$closingBalanceAmount', 0]
            }
          },
          totalDr: {
            $sum: {
              $cond: [{ $eq: ['$outstandingType', 'dr'] }, '$closingBalanceAmount', 0]
            }
          },
          totalCr: {
            $sum: {
              $cond: [{ $eq: ['$outstandingType', 'cr'] }, '$closingBalanceAmount', 0]
            }
          },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          partyType: {
            $cond: [
              { $gt: [{ $size: '$accountTypes' }, 1] },
              'both',
              { $arrayElemAt: ['$accountTypes', 0] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalParties: { $sum: 1 },
          partiesWithBothTypes: {
            $sum: {
              $cond: [{ $eq: ['$partyType', 'both'] }, 1, 0]
            }
          },
          customersOnly: {
            $sum: {
              $cond: [{ $eq: ['$partyType', 'customer'] }, 1, 0]
            }
          },
          suppliersOnly: {
            $sum: {
              $cond: [{ $eq: ['$partyType', 'supplier'] }, 1, 0]
            }
          },
          totalNetOutstanding: { $sum: '$totalOutstanding' },
          totalReceivables: { $sum: '$customerOutstanding' },
          totalPayables: { $sum: { $abs: '$supplierOutstanding' } },
          totalDrAmount: { $sum: '$totalDr' },
          totalCrAmount: { $sum: '$totalCr' },
          totalTransactions: { $sum: '$transactionCount' }
        }
      }
    ]);

    const summaryData = summaryAggregate[0] || {};

    const summary = {
      totalParties: totalCount,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
      pageSize: pageSize,
      partiesWithBothTypes: summaryData.partiesWithBothTypes || 0,
      customersOnly: summaryData.customersOnly || 0,
      suppliersOnly: summaryData.suppliersOnly || 0,
      totalNetOutstanding: summaryData.totalNetOutstanding || 0,
      totalReceivables: summaryData.totalReceivables || 0,
      totalPayables: summaryData.totalPayables || 0,
      totalDrAmount: summaryData.totalDrAmount || 0,
      totalCrAmount: summaryData.totalCrAmount || 0,
      totalTransactions: summaryData.totalTransactions || 0
    };

    res.status(200).json({
      success: true,
      data: {
        parties: formattedParties,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching outstanding parties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outstanding parties',
      error: error.message
    });
  }
};

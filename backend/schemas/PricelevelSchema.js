// import mongoose from "mongoose";
// const PriceLevelSchema = new mongoose.Schema(
//     {
//         priceLevelName: { type: String, required: [true, "pricelevel name is required"] },
//         selected: [],
//         companyId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Company"
//         }

//     }, {
//     timestamps: true
// })
// export default PriceLevelSchema

import mongoose from "mongoose";

const PriceLevelSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: [true, "Company is required"]
        },
        priceLevelName: {
            type: String,
            required: [true, "Price level name is required"],
            trim: true,
            maxlength: [50, 'Price level name cannot exceed 50 characters']
        },
        branches: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch"
        }],
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'Description cannot exceed 200 characters']
        },
        status: {
            type: String,
            enum: {
                values: ['active', 'inactive'],
                message: 'Status must be either active or inactive'
            },
            default: 'active'
        }
    }, 
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ==================== INDEXES ====================
PriceLevelSchema.index({ company: 1, status: 1 });
PriceLevelSchema.index({ company: 1, 'branches': 1 });
PriceLevelSchema.index({ priceLevelName: "text", description: "text" });

// ==================== VIRTUALS ====================
// Count of allocated branches
PriceLevelSchema.virtual('branchCount').get(function() {
    return this.branches?.length || 0;
});

// Check if allocated to any branches
PriceLevelSchema.virtual('isAllocated').get(function() {
    return (this.branches?.length || 0) > 0;
});

// ==================== INSTANCE METHODS ====================
// Allocate to branches
PriceLevelSchema.methods.allocateToBranches = function(branchIds) {
    // Remove duplicates and add new branches
    const existingBranches = this.branches.map(b => b.toString());
    const newBranches = branchIds.filter(id => !existingBranches.includes(id.toString()));
    
    this.branches = [...this.branches, ...newBranches];
    return this.save();
};

// Remove from branches
PriceLevelSchema.methods.removeFromBranches = function(branchIds) {
    this.branches = this.branches.filter(
        b => !branchIds.some(id => id.toString() === b.toString())
    );
    return this.save();
};

// Update status
PriceLevelSchema.methods.updateStatus = function(newStatus) {
    if (!['active', 'inactive'].includes(newStatus)) {
        throw new Error('Invalid status. Must be active or inactive');
    }
    
    this.status = newStatus;
    return this.save();
};

// Check if price level can be deleted
PriceLevelSchema.methods.canBeDeleted = async function() {
    // Check if used in Account Master
    const AccountMaster = mongoose.model('AccountMaster');
    const accountCount = await AccountMaster.countDocuments({ priceLevel: this._id });
    
    if (accountCount > 0) {
        return {
            canDelete: false,
            reason: `Price level is used by ${accountCount} account(s)`
        };
    }
    
    // Check if used in Item Master
    const ItemMaster = mongoose.model('ItemMaster');
    const itemCount = await ItemMaster.countDocuments({ 'priceLevels.priceLevel': this._id });
    
    if (itemCount > 0) {
        return {
            canDelete: false,
            reason: `Price level is used by ${itemCount} item(s)`
        };
    }
    
    return { canDelete: true };
};

// ==================== STATIC METHODS ====================
// Get active price levels for a company
PriceLevelSchema.statics.getActivePriceLevels = function(companyId) {
    return this.find({ 
        company: companyId, 
        status: 'active' 
    })
    .populate('branches', 'branchName ')
    .sort({ priceLevelName: 1 });
};

// Get price levels by branch
PriceLevelSchema.statics.getPriceLevelsByBranch = function(branchId) {
    return this.find({
        branches: branchId,
        status: 'active'
    })
    .populate('company', 'companyName')
    .sort({ priceLevelName: 1 });
};

// Search price levels
PriceLevelSchema.statics.searchPriceLevels = function(companyId, searchTerm) {
    const searchRegex = new RegExp(searchTerm, 'i');
    
    return this.find({
        company: companyId,
        $or: [
            { priceLevelName: searchRegex },
            { description: searchRegex }
        ]
    })
    .populate('branches', 'branchName')
    .sort({ priceLevelName: 1 });
};

// Get unallocated price levels
PriceLevelSchema.statics.getUnallocatedPriceLevels = function(companyId) {
    return this.find({
        company: companyId,
        branches: { $size: 0 },
        status: 'active'
    }).sort({ priceLevelName: 1 });
};

export default PriceLevelSchema;


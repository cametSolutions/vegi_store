// Utility to check references before deletion
export const isMasterReferenced = async (references, masterId) => {
  for (const { model, field } of references) {
    const used = await model.exists({ [field]: masterId });
    if (used) return true;
  }
  return false;
};
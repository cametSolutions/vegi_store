import { createResourceApi } from "./apiClient";
import { BranchFormData } from "../validation/branchSchema";
export const branchApi=createResourceApi<BranchFormData>("branch",{
create:"createbranches",//POST route
getAll:"getallbranches",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})

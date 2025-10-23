import { createResourceApi } from "../api/client/apiClient";
export const branchApi=createResourceApi("branch",{
create:"createbranches",//POST route
getAll:"getallbranches",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})
export default branchApi
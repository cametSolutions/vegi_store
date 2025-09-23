import { createResourceApi } from "./apiClient";
export const accountmasterApi=createResourceApi("accountmaster",{
create:"createaccountmaster",//POST route
getAll:"getallaccountmaster",//GET route
update:"updateaccntmaster",//PUT route
delete:"deleteaccntmaster",//DELETE route
})
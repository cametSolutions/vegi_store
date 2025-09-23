
import { createResourceApi } from "./apiClient";
export const companyApi=createResourceApi("company",{
create:"createcompanies",//POST route
getAll:"getallcompanies",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})

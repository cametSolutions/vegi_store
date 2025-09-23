
import { createResourceApi } from "./apiClient";
import { CompanyFormData } from "../validation/companySchema";
export const companyApi=createResourceApi<CompanyFormData>("company",{
create:"createcompanies",//POST route
getAll:"getallcompanies",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})

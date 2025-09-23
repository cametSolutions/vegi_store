import { createResourceApi } from "./apiClient";
import { AccountmasterFormData } from "../validation/accountmasterSchema";
export const accountmasterApi=createResourceApi<AccountmasterFormData>("accountmaster",{
create:"createaccountmaster",//POST route
getAll:"getallaccountmaster",//GET route
update:"updateaccntmaster",//PUT route
delete:"deleteaccntmaster",//DELETE route
})
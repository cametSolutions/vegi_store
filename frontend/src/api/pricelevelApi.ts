import { createResourceApi } from "./apiClient";
import { PricelevelFormData } from "../validation/pricelevelSchema";
export const pricelevelApi=createResourceApi<PricelevelFormData>("pricelevel",{
create:"createpricelevel",//POST route
getAll:"getallpricelevel",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})
import { createResourceApi } from "./apiClient";
export const pricelevelApi=createResourceApi("pricelevel",{
create:"createpricelevel",//POST route
getAll:"getallpricelevel",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})
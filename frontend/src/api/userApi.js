import { createResourceApi } from "./apiClient.js";
export const userApi=createResourceApi("user",{
create:"createusers",//POST route
getAll:"users",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})

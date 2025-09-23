import { createResourceApi } from "./apiClient"
export const itemmasterApi=createResourceApi("item",{
create:"createitem",//POST route
getAll:"getallitems",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})
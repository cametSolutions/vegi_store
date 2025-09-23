import { createResourceApi } from "./apiClient"
import { ItemFormData } from "../validation/itemmasterSchema"
export const itemmasterApi=createResourceApi<ItemFormData>("item",{
create:"createitem",//POST route
getAll:"getallitems",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})
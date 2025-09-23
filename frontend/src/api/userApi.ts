import { createResourceApi } from "./apiClient";
import { UserFormData } from "../validation/userSchema.js";
export const userApi=createResourceApi<UserFormData>("user",{
create:"createusers",//POST route
getAll:"users",//GET route
update:"update",//PUT route
delete:"delete",//DELETE route
})

import express from "express"
import {createUsers, getUserById} from "../../controller/master/userController.js"
const router=express.Router()
router.post("/createusers",createUsers)
router.get("/:id",getUserById)
export default router
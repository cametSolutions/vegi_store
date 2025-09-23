import express from "express"
import {createUsers} from "../../controller/master/userController.js"
const router=express.Router()
router.post("/createusers",createUsers)
export default router
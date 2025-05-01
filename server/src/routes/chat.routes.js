import {Router} from "express"

import {chatSectionHandling } from "../controllers/chat.controllers.js"
const router = Router();
router.route("/chat").get(chatSectionHandling)
export default router;
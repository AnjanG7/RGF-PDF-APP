import {Router} from "express"
import { uploadPdf } from "../controllers/pdf.controllers.js"
import {upload} from "../middlewares/multer.middlewares.js"
const router = Router();
router.route("/pdf").post(upload.single("pdf"),uploadPdf)
export default router;
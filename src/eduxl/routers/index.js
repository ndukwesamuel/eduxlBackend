import { Router } from "express";

import subjectRoute from "./subjectRoute.js";

const v1rootRouter = Router();

v1rootRouter.use("/", subjectRoute);

export default v1rootRouter;

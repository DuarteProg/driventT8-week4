import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import {showBooking, postBooking, updateBooking} from "@/controllers"

const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", showBooking)
  .post("/", postBooking)
  .put("/:bookingId", updateBooking);

export { bookingRouter };
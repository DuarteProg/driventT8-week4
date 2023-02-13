import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function showBooking(req: AuthenticatedRequest, res: Response) {
  const userId = +req.userId;

  try {
    const booking = await bookingService.getBooking(userId);
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND); 
    }
    
    
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const userId = +req.userId;
  const {roomId} = req.body;

 
  if(!Number(roomId)) return res.sendStatus(httpStatus.NOT_FOUND);
  try {
    const createBooking = await bookingService.createBooking(userId, Number(roomId));

    return res.status(httpStatus.OK).send({ bookingId: createBooking.id });
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "PaymentRequiredError") {
      return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
    }
    if (error.name === "UnauthorizedError") {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
    res.sendStatus(httpStatus.FORBIDDEN);
  }
}
export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const {roomId} = req.body;
  const {bookingId} = req.params;
  const {userId} = req;

  try {
    const bookingUpdate = await bookingService.updateBooking(userId, Number(bookingId), roomId);
    return res.status(httpStatus.OK).send({ bookingId: bookingUpdate.id });
  } catch (error) {
    if (error.name === "NotFoundError") return res.sendStatus(httpStatus.NOT_FOUND);
    
    if (error.name === "UnauthorizedError") return res.sendStatus(httpStatus.UNAUTHORIZED);

    res.sendStatus(httpStatus.FORBIDDEN);
  }
}
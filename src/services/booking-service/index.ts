import { notFoundError, unauthorizedError, paymentRequiredError, forbiddenError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import bookingRepository from "@/repositories/booking-repository";
import { TicketStatus } from "@prisma/client";
import ticketRepository from "@/repositories/ticket-repository";
import hotelRepository from "@/repositories/hotel-repository";

async function getBooking(userId: number) {
  const getBooking = await bookingRepository.showBooking(userId);
  if (!getBooking) {
    throw notFoundError();
  }
  
  return getBooking;
}

async function createBooking(userId: number, roomId: number) {
  const getBooking = await bookingRepository.showBooking(userId);
  const getRoom = await bookingRepository.findRoomById(roomId);
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw notFoundError();

  const ticketeTciketType = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticketeTciketType) throw paymentRequiredError();
  
  if (ticketeTciketType.status === TicketStatus.RESERVED) throw paymentRequiredError();
  if (ticketeTciketType.TicketType.isRemote === true || ticketeTciketType.TicketType.includesHotel === false)
  throw unauthorizedError();
  
  if (!getRoom) throw forbiddenError();
  /*if (!getBooking) throw notFoundError();*/
  
  const bookingsRoom = await bookingRepository.countBook(roomId);
  
  if(bookingsRoom >= getBooking.Room.capacity ) throw forbiddenError();

  const postBooking = await bookingRepository.postBooking(userId, roomId)
  return postBooking;
}

async function updateBooking(userId: number, bookingId: number, roomId: number) {
  const book = await bookingRepository.showBooking(userId);
  const getBooking = await bookingRepository.showBooking(userId);
  const getallBook = await bookingRepository.showBookingAllBook(bookingId);
  const room = await hotelRepository.getHotelByHotelId(roomId);
  const booking = await bookingRepository.findUserId(userId)
  const findRoom = await bookingRepository.findRoomById(roomId)

  if(!booking.Room.id) throw notFoundError();
  if(!findRoom) throw notFoundError();
  if(!book || book.id !== bookingId) throw unauthorizedError();

  if(getallBook.userId !== userId) throw forbiddenError();

  const bookingsRoom = await bookingRepository.getQTDroomCapacity(userId);
  
  const bookList = bookingsRoom.length + 1;
  if(bookList >= Number(book.Room.capacity)) throw forbiddenError();

  const bookingUpdate = await bookingRepository.bookUpdate(bookingId, roomId);
  return bookingUpdate;
}

const bookingService = {
  getBooking,
  createBooking,
  updateBooking
};

export default bookingService;
import { prisma } from "@/config";
import { Booking } from "@prisma/client";
import { BookingCreation, BookingUpsert } from "@/protocols";

async function showBooking(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId,
    },
    select: {
      id: true,
      Room: true,
    }
  });
}

async function showBookingAllBook(id: number) {
  return prisma.booking.findFirst({
    where: {
      id,
    },
    
  });
}

async function postBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId,
    }
  });
}
  
async function countBook(roomId: number) {
  return prisma.booking.count({
    where: {
      roomId
    }
  });
}

async function bookUpdate(bookingId: number, roomId: number) {
  return prisma.booking.update({
    where: {
      id: bookingId
    },
    data: {
      roomId
    }
  });
}

async function getQTDroomCapacity(userId: number) { 
  return prisma.booking.findMany({
    where: {
      userId
    }
  });
}

async function findUserId(userId: number) { 
  return prisma.booking.findFirst({
    where:{
      userId
    },
    include:{
      Room: true
    }
  })
}

async function findRoomById(roomId: number) { 
  return prisma.room.findFirst({
    where: {
      id: roomId
    }
  });
}

const bookingRepository = {
  showBooking,
  postBooking,
  countBook,
  bookUpdate,
  showBookingAllBook,
  getQTDroomCapacity,
  findUserId,
  findRoomById
};
    
export default bookingRepository;


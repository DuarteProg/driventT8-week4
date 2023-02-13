import { prisma } from "@/config";
import { User, Room } from "@prisma/client";
import {
  createUser,
} from "./users-factory";
import { createRoomHotel } from "./room-factory";

export async function createBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId,
      roomId
    }
  }); 
}

export async function createBookingWithoutUser(user?: User, Room?: Room) {
  const User = user || (await createUser());
  const room = Room || (await createRoomHotel());
  return prisma.booking.create({
    data: {
      userId: User.id,
      roomId: room.id
    }
  }); 
}
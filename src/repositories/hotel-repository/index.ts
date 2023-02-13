import { prisma } from "@/config";

async function findHotels() {
  return prisma.hotel.findMany();
}

async function findRoomsByHotelId(hotelId: number) {
  return prisma.hotel.findFirst({
    where: {
      id: hotelId,
    },
    include: {
      Rooms: true,
    }
  });
}

async function getHotelByHotelId(hotelId: number) {
  return prisma.hotel.findFirst({
    where: {
      id: hotelId
    },
    include: {
      Rooms: true
    }
  });
}








const hotelRepository = {
  findHotels,
  findRoomsByHotelId,
  getHotelByHotelId
};

export default hotelRepository;

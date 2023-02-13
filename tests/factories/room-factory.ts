import faker from "@faker-js/faker";
import { prisma } from "@/config";
import { Hotel } from "@prisma/client";

async function createHotel() {
  return prisma.hotel.create({
    data: {
      name: "hotel cinco estrelas",
      image:
        "https://cdn.panrotas.com.br/portal-panrotas-statics/media-files-cache/301395/078fea0259c5b673bf2d35bcc14f0da5pestanaalvorsouthbeachexterior5/61,0,2424,1447/1206,720,0.24/0/default.jpg",
    },
  });
}

export async function createRoomHotel(hotel?: Hotel) {
  const Hotel = hotel || await(createHotel()); 
  
  return prisma.room.create({
    data: {
      name: faker.name.findName(),
      capacity: 1,
      hotelId: Hotel.id
    }
  });
}

export async function thereIsBooking(hotelId: number) {
  return prisma.room.create({
    data: {
      name: faker.name.findName(),
      capacity: 1,
      hotelId
    }
  });
}
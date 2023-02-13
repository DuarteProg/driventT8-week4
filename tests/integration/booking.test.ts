import app, { init } from "@/app";
import { prisma } from "@/config";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicketType,
  createTicket,
  createTicketType1,
  createTicketTypeInvalid,
  createHotel,
  createRoomHotel,
  createBooking,
  createTicketWithHotel,
  createTicketWithoutHotel,
  thereIsBooking,
  createBookingWithoutUser,
} from "../factories";
import { create } from "domain";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
});

describe("when token is valid", () => {
  it("should respond with status 404 if there is no booking yes", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("should respond with status 200 and with existing Hotel data", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const hotel = await createHotel();
    const room = await createRoomHotel();
    const booking = await createBooking(user.id, room.id);
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      id: booking.id,
      Room: {
        ...room,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
      },
    });
  });

});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.post("/hotels").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 if there is no booking yes", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 if there is no enrollment yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 402 if there is no ticket yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      await createEnrollmentWithAddress(user);
      
      

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 402 if there is no ticketPaid yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
      expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
    });

    it("should respond with status 401 if is remote and not includesHotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketWithoutHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
      expect(response.status).toEqual(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 404 if there is no roomId yet", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({});
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("Should respond with status 403 when the room has no more capacity", async () => {
      const user = await createUser();
      const user2 = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await thereIsBooking(hotel.id);
      await createBooking(user.id, room.id);
      await createBooking(user2.id, room.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: room.id });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("Should respond with status 200 and bookingId", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await thereIsBooking(hotel.id);
      const body = { roomId: room.id };
      const beforeCount = await prisma.booking.count();
      await createBooking(user.id, room.id);

      await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

      const afterCount = await prisma.booking.count();

      expect(beforeCount).toEqual(0);
      expect(afterCount).toEqual(1);
    });
  });

  describe("PUT /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
      const response = await server.put("/booking");

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();

      const response = await server.put("/hotels").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const response = await server.put("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("When token is valid", () => {
      it("should respond with status 403 if there is no bookingId", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });
      it("should respond with status 403 if roomId is invalid", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createHotel();
      

        const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });
      it("Should respond with status 404 when roomId is wrong", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await thereIsBooking(hotel.id);
        const booking = await createBooking(user.id, room.id);
        const response = await server
          .put(`/booking/${booking.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ roomId: 0 });
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });

      it("Should respond with status 403 when the room has no more capacity", async () => {
        const user2 = await createUser();
        const user1 = await createUser();
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await thereIsBooking(hotel.id);
        const booking = await createBooking(user.id, room.id);
        const booking1 = await createBooking(user1.id, room.id);
        const booking2 = await createBooking(user2.id, room.id);
        const response = await server
          .put(`/booking/${booking.id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({ roomId: room.id });
        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });

      it("Should respond with status 404 when roomId is wrong", async () => {
        const user3 = await createUser();
        const hotel2 = await createHotel();
        const room2 = await thereIsBooking(hotel2.id);
        const booking2 = await createBooking(user3.id, room2.id);

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const hotel = await createHotel();
        const room = await thereIsBooking(hotel.id);
        const body = { roomId: 0 };
        const beforeCount = await prisma.booking.count();
        await createBooking(user.id, room.id);

        await server.post(`/booking/${booking2.id}`).set("Authorization", `Bearer ${token}`).send(body);

        const afterCount = await prisma.booking.count();

        expect(beforeCount).toEqual(1);
        expect(afterCount).toEqual(2);
      });

      it("Should respond with status 200 and bookingId", async () => {
        const user3 = await createUser();
        const hotel2 = await createHotel();
        const room2 = await thereIsBooking(hotel2.id);
        const booking2 = await createBooking(user3.id, room2.id);

        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const hotel = await createHotel();
        const room = await thereIsBooking(hotel.id);
        const body = { roomId: room.id };
        const beforeCount = await prisma.booking.count();
        await createBooking(user.id, room.id);

        await server.post(`/booking/${booking2.id}`).set("Authorization", `Bearer ${token}`).send(body);

        const afterCount = await prisma.booking.count();

        expect(beforeCount).toEqual(1);
        expect(afterCount).toEqual(2);
      });
    });
  });
});



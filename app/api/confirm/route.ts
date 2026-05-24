import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reservationId } = body;

    // 1. Validate that the reservation ID was sent
    if (!reservationId) {
      return NextResponse.json(
        { error: "Missing reservationId" },
        { status: 400 }
      );
    }

    // 2. Process the confirmation inside a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      
      // Find the reservation details
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      // If it doesn't exist, or it isn't PENDING anymore, stop here
      if (!reservation || reservation.status !== "PENDING") {
        throw new Error("INVALID_RESERVATION");
      }

      // Check if the current time is past the expiration time
      const now = new Date();
      if (now > new Date(reservation.expiresAt)) {
        throw new Error("RESERVATION_EXPIRED");
      }

      // 3. Since payment succeeded, permanently decrement total stock
      // and decrement reserved stock (since it's no longer just a hold)
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          totalQuantity: { decrement: reservation.quantity },
          reservedQuantity: { decrement: reservation.quantity },
        },
      });

      // 4. Update reservation status to CONFIRMED
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CONFIRMED" },
      });

      return updatedReservation;
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Confirmation Error:", error);

    // If the timer ran out, return a 410 Gone status code
    if (error.message === "RESERVATION_EXPIRED") {
      return NextResponse.json(
        { error: "Reservation has expired" },
        { status: 410 }
      );
    }

    if (error.message === "INVALID_RESERVATION") {
      return NextResponse.json(
        { error: "Reservation is invalid or already processed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
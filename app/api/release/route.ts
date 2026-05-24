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

    // 2. Process the early release inside a transaction
    const updatedReservation = await prisma.$transaction(async (tx: any) => {
      
      // Look up the reservation
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      // If it doesn't exist, or it's not PENDING, we can't release it
      if (!reservation || reservation.status !== "PENDING") {
        throw new Error("CANNOT_RELEASE");
      }

      // 3. Subtract the quantity from reservedQuantity to put it back in the pool
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          reservedQuantity: { decrement: reservation.quantity },
        },
      });

      // 4. Flip the status to RELEASED
      return await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "RELEASED" },
      });
    });

    return NextResponse.json(updatedReservation, { status: 200 });

  } catch (error: any) {
    console.error("Release Error:", error);

    if (error.message === "CANNOT_RELEASE") {
      return NextResponse.json(
        { error: "Reservation cannot be released (it may be expired or already confirmed)" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import prisma from '@/prisma/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, warehouseId, quantity } = body;

    if (!productId || !warehouseId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }
    const reservation = await prisma.$transaction(async (tx:any) => {
    
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      });

      if (!inventory) {
        throw new Error("INVENTORY_NOT_FOUND");
      }

      const availableQuantity = inventory.totalQuantity - inventory.reservedQuantity;

      if (availableQuantity < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedQuantity: { increment: quantity },
        },
      });

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      return await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: "PENDING",
          expiresAt,
        },
      });
    });

    return NextResponse.json(reservation, { status: 201 });

  } catch (error: any) {
    console.error("Reservation Error:", error);

    if (error.message === "INSUFFICIENT_STOCK" || error.message === "INVENTORY_NOT_FOUND") {
      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
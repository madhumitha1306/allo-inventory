import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Fetch inventory items and include the joined warehouse table data
    const inventoryItems = await prisma.inventory.findMany({
      include: {
        warehouse: true, 
      },
    });

    // 2. Map data so warehouseId sends the real name string to the frontend dashboard
    const responseData = inventoryItems.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      warehouseId: item.warehouse?.name || 'Location Node', 
      totalQuantity: item.totalQuantity,
      reservedQuantity: item.reservedQuantity,
      availableQuantity: item.totalQuantity - item.reservedQuantity,
    }));

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory records' },
      { status: 500 }
    );
  }
}
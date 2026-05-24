import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear old data
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  // Create products
  const laptop = await prisma.product.create({
    data: {
      name: "Laptop",
    },
  });

  const phone = await prisma.product.create({
    data: {
      name: "Phone",
    },
  });

  // Create warehouses
  const chennaiWarehouse = await prisma.warehouse.create({
    data: {
      name: "Chennai Warehouse",
    },
  });

  const bangaloreWarehouse = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse",
    },
  });

  // Create inventory
  await prisma.inventory.createMany({
    data: [
      {
        productId: laptop.id,
        warehouseId: chennaiWarehouse.id,
        totalQuantity: 10,
        reservedQuantity: 2,
      },
      {
        productId: phone.id,
        warehouseId: chennaiWarehouse.id,
        totalQuantity: 20,
        reservedQuantity: 5,
      },
      {
        productId: laptop.id,
        warehouseId: bangaloreWarehouse.id,
        totalQuantity: 15,
        reservedQuantity: 3,
      },
    ],
  });

  console.log("Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
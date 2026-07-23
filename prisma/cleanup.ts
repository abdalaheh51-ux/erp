import { db } from "../src/lib/db";

async function main() {
  console.log("Deleting all data...");
  
  await db.payment.deleteMany({});
  console.log("Deleted payments");
  
  await db.invoiceItem.deleteMany({});
  console.log("Deleted invoice items");
  
  await db.invoice.deleteMany({});
  console.log("Deleted invoices");
  
  await db.interaction.deleteMany({});
  console.log("Deleted interactions");
  
  await db.deal.deleteMany({});
  console.log("Deleted deals");
  
  await db.customer.deleteMany({});
  console.log("Deleted customers");
  
  await db.product.deleteMany({});
  console.log("Deleted products");
  
  console.log("All data deleted successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

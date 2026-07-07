// Seed script - run with: bun run prisma/seed.ts
import { db } from "../src/lib/db";

async function main() {
  console.log("Seeding database...");

  // Products
  const products = await Promise.all([
    db.product.create({ data: { name: "Website Template - Corporate", price: 12000, description: "Modern corporate website template with CMS" } }),
    db.product.create({ data: { name: "Maintenance Plan - Monthly", price: 2500, description: "Monthly maintenance and security updates" } }),
    db.product.create({ data: { name: "E-commerce Setup", price: 35000, description: "Full e-commerce store setup with payment integration" } }),
    db.product.create({ data: { name: "SEO Audit Report", price: 8000, description: "Comprehensive SEO audit with recommendations" } }),
    db.product.create({ data: { name: "Mobile App - Basic", price: 55000, description: "Cross-platform mobile app (iOS + Android)" } }),
    db.product.create({ data: { name: "Logo & Brand Identity", price: 6000, description: "Logo design + brand guidelines" } }),
    db.product.create({ data: { name: "Hosting - Annual", price: 4800, description: "Annual managed cloud hosting" } }),
  ]);

  // Customers
  const customers = await Promise.all([
    db.customer.create({ data: { name: "Alpha Trading Co.", email: "info@alphatrading.com", phone: "+20 100 123 4567", status: "active", source: "website" } }),
    db.customer.create({ data: { name: "Bright Solutions LLC", email: "contact@brightsolutions.io", phone: "+20 101 234 5678", status: "lead", source: "referral" } }),
    db.customer.create({ data: { name: "Cairo Retail Group", email: "hello@cairet.com", phone: "+20 102 345 6789", status: "active", source: "social_media" } }),
    db.customer.create({ data: { name: "Delta Manufacturing", email: "procurement@deltamfg.com", phone: "+20 103 456 7890", status: "new", source: "ads" } }),
    db.customer.create({ data: { name: "Echo Media House", email: "team@echomedia.com", phone: "+20 104 567 8901", status: "active", source: "website" } }),
    db.customer.create({ data: { name: "Future Tech Startup", email: "founders@futuretech.io", phone: "+20 105 678 9012", status: "lead", source: "referral" } }),
    db.customer.create({ data: { name: "Giza Properties", email: "sales@gizaprops.com", phone: "+20 106 789 0123", status: "inactive", source: "other" } }),
    db.customer.create({ data: { name: "Horizon Logistics", email: "ops@horizonlog.com", phone: "+20 107 890 1234", status: "new", source: "social_media" } }),
  ]);

  // Deals
  const deals = await Promise.all([
    db.deal.create({ data: { title: "Corporate Website Redesign", value: 45000, stage: "negotiation", customerId: customers[0].id } }),
    db.deal.create({ data: { title: "Annual Maintenance Contract", value: 30000, stage: "won", customerId: customers[0].id } }),
    db.deal.create({ data: { title: "E-commerce Platform", value: 80000, stage: "proposal", customerId: customers[1].id } }),
    db.deal.create({ data: { title: "Retail POS Integration", value: 55000, stage: "contact", customerId: customers[2].id } }),
    db.deal.create({ data: { title: "Manufacturing ERP Module", value: 120000, stage: "proposal", customerId: customers[3].id } }),
    db.deal.create({ data: { title: "Media Website + Hosting", value: 25000, stage: "won", customerId: customers[4].id } }),
    db.deal.create({ data: { title: "Startup Mobile App MVP", value: 95000, stage: "negotiation", customerId: customers[5].id } }),
    db.deal.create({ data: { title: "Property Listing Portal", value: 70000, stage: "lost", customerId: customers[6].id } }),
    db.deal.create({ data: { title: "Logistics Tracking System", value: 110000, stage: "contact", customerId: customers[7].id } }),
  ]);

  // Interactions
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  await Promise.all([
    db.interaction.create({ data: { content: "Initial discovery call. Client needs a full website redesign with new branding. Decision maker is the marketing director.", date: daysAgo(3), type: "call", customerId: customers[0].id } }),
    db.interaction.create({ data: { content: "Sent revised proposal with 3 tier options. Awaiting feedback by end of week.", date: daysAgo(1), type: "email", customerId: customers[0].id } }),
    db.interaction.create({ data: { content: "Onboarding meeting scheduled. Walked client through maintenance SLA and support channels.", date: daysAgo(7), type: "meeting", customerId: customers[0].id } }),
    db.interaction.create({ data: { content: "Referred by Alpha Trading. Looking for e-commerce solution with multi-vendor support.", date: daysAgo(5), type: "note", customerId: customers[1].id } }),
    db.interaction.create({ data: { content: "Demo call went well. Interested in POS + inventory sync. Will send technical specs.", date: daysAgo(2), type: "call", customerId: customers[2].id } }),
    db.interaction.create({ data: { content: "Factory visit completed. Requirements gathered for production planning module.", date: daysAgo(4), type: "meeting", customerId: customers[3].id } }),
    db.interaction.create({ data: { content: "Contract signed and invoice issued for hosting + maintenance.", date: daysAgo(10), type: "note", customerId: customers[4].id } }),
    db.interaction.create({ data: { content: "MVP scope discussion. They want iOS + Android in 3 months. Budget confirmed.", date: daysAgo(6), type: "meeting", customerId: customers[5].id } }),
    db.interaction.create({ data: { content: "No response to follow-ups for 60 days. Marking as inactive.", date: daysAgo(45), type: "note", customerId: customers[6].id } }),
    db.interaction.create({ data: { content: "LinkedIn lead. Wants tracking system for fleet of 50+ vehicles.", date: daysAgo(1), type: "call", customerId: customers[7].id } }),
  ]);

  // Invoices
  const inv1 = await db.invoice.create({ data: { number: "INV-0001", totalAmount: 30000, status: "paid", dueDate: daysAgo(-5), customerId: customers[0].id, dealId: deals[1].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv1.id, productId: products[1].id, quantity: 12, unitPrice: 2500 } });

  const inv2 = await db.invoice.create({ data: { number: "INV-0002", totalAmount: 16800, status: "pending", dueDate: daysAgo(-14), customerId: customers[4].id, dealId: deals[5].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv2.id, productId: products[0].id, quantity: 1, unitPrice: 12000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv2.id, productId: products[6].id, quantity: 1, unitPrice: 4800 } });

  const inv3 = await db.invoice.create({ data: { number: "INV-0003", totalAmount: 55000, status: "overdue", dueDate: daysAgo(7), customerId: customers[2].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv3.id, productId: products[2].id, quantity: 1, unitPrice: 35000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv3.id, productId: products[0].id, quantity: 1, unitPrice: 12000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv3.id, productId: products[5].id, quantity: 1, unitPrice: 6000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv3.id, productId: products[3].id, quantity: 0.25, unitPrice: 2000 } });

  const inv4 = await db.invoice.create({ data: { number: "INV-0004", totalAmount: 8000, status: "draft", dueDate: daysAgo(-30), customerId: customers[1].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv4.id, productId: products[3].id, quantity: 1, unitPrice: 8000 } });

  const inv5 = await db.invoice.create({ data: { number: "INV-0005", totalAmount: 47500, status: "paid", dueDate: daysAgo(-3), customerId: customers[3].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv5.id, productId: products[4].id, quantity: 0.5, unitPrice: 27500 } });
  await db.invoiceItem.create({ data: { invoiceId: inv5.id, productId: products[6].id, quantity: 2, unitPrice: 4800 } });
  await db.invoiceItem.create({ data: { invoiceId: inv5.id, productId: products[1].id, quantity: 2, unitPrice: 2500 } });
  await db.invoiceItem.create({ data: { invoiceId: inv5.id, productId: products[5].id, quantity: 2, unitPrice: 5000 } });

  // Payments
  await Promise.all([
    db.payment.create({ data: { invoiceId: inv1.id, amount: 15000, paymentMethod: "bank_transfer", date: daysAgo(8) } }),
    db.payment.create({ data: { invoiceId: inv1.id, amount: 15000, paymentMethod: "bank_transfer", date: daysAgo(2) } }),
    db.payment.create({ data: { invoiceId: inv5.id, amount: 47500, paymentMethod: "payment_gateway", date: daysAgo(3) } }),
  ]);

  console.log("Seed complete.");
  console.log({ products: products.length, customers: customers.length, deals: deals.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

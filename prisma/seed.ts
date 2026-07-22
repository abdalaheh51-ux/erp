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
    db.product.create({ data: { name: "API Integration", price: 18000, description: "Custom API integration with third-party services" } }),
    db.product.create({ data: { name: "Database Setup & Optimization", price: 15000, description: "Database design, setup, and performance tuning" } }),
    db.product.create({ data: { name: "Training - 5 Days", price: 12000, description: "On-site staff training and documentation" } }),
    db.product.create({ data: { name: "Support Package - 12 months", price: 9600, description: "Priority email and phone support for 1 year" } }),
    db.product.create({ data: { name: "Data Migration", price: 22000, description: "Secure data migration from legacy systems" } }),
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
    db.customer.create({ data: { name: "Innovation Labs", email: "hello@innovlabs.io", phone: "+20 108 901 2345", status: "active", source: "website" } }),
    db.customer.create({ data: { name: "JetStream Solutions", email: "sales@jetstrem.com", phone: "+20 109 012 3456", status: "lead", source: "ads" } }),
    db.customer.create({ data: { name: "King Digital Services", email: "info@kingdigital.com", phone: "+20 110 123 4567", status: "active", source: "referral" } }),
    db.customer.create({ data: { name: "Luna Financial Group", email: "contact@lunafinance.com", phone: "+20 111 234 5678", status: "new", source: "website" } }),
    db.customer.create({ data: { name: "Metro Transport Co.", email: "admin@metrotrans.com", phone: "+20 112 345 6789", status: "lead", source: "social_media" } }),
    db.customer.create({ data: { name: "NextGen Consulting", email: "hello@nextgenconsult.io", phone: "+20 113 456 7890", status: "active", source: "website" } }),
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
    db.deal.create({ data: { title: "Lab Management System", value: 88000, stage: "proposal", customerId: customers[8].id } }),
    db.deal.create({ data: { title: "Marketing Automation Platform", value: 65000, stage: "negotiation", customerId: customers[9].id } }),
    db.deal.create({ data: { title: "Digital Services Suite", value: 150000, stage: "won", customerId: customers[10].id } }),
    db.deal.create({ data: { title: "Banking Portal Integration", value: 200000, stage: "contact", customerId: customers[11].id } }),
    db.deal.create({ data: { title: "Fleet Management Solution", value: 75000, stage: "proposal", customerId: customers[12].id } }),
    db.deal.create({ data: { title: "Enterprise Consulting Package", value: 180000, stage: "negotiation", customerId: customers[13].id } }),
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
    db.interaction.create({ data: { content: "Lab director expressed interest in our management system. Scheduled technical presentation.", date: daysAgo(2), type: "meeting", customerId: customers[8].id } }),
    db.interaction.create({ data: { content: "Sent marketing automation product demo. Positive response received.", date: daysAgo(3), type: "email", customerId: customers[9].id } }),
    db.interaction.create({ data: { content: "Successfully implemented digital services. Happy client, requesting referral discount.", date: daysAgo(8), type: "call", customerId: customers[10].id } }),
    db.interaction.create({ data: { content: "Bank's IT director wants to discuss integration architecture next week.", date: daysAgo(0), type: "email", customerId: customers[11].id } }),
    db.interaction.create({ data: { content: "Metro Transport CEO interested in reducing manual fleet operations. Sent ROI analysis.", date: daysAgo(4), type: "note", customerId: customers[12].id } }),
    db.interaction.create({ data: { content: "Strategic consulting kickoff. Executive steering committee formed.", date: daysAgo(5), type: "meeting", customerId: customers[13].id } }),
    db.interaction.create({ data: { content: "Follow-up on proposal feedback. Client wants API documentation first.", date: daysAgo(1), type: "email", customerId: customers[1].id } }),
    db.interaction.create({ data: { content: "Negotiation with stakeholders on budget allocation completed.", date: daysAgo(3), type: "note", customerId: customers[5].id } }),
  ]);

  // Invoices and Payments
  const timestamp = Date.now();
  const inv1 = await db.invoice.create({ data: { number: `INV-${timestamp}-001`, totalAmount: 30000, status: "paid", dueDate: daysAgo(-5), customerId: customers[0].id, dealId: deals[1].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv1.id, productId: products[1].id, quantity: 12, unitPrice: 2500 } });
  await db.payment.create({ data: { invoiceId: inv1.id, amount: 15000, paymentMethod: "bank_transfer", date: daysAgo(8) } });
  await db.payment.create({ data: { invoiceId: inv1.id, amount: 15000, paymentMethod: "bank_transfer", date: daysAgo(2) } });

  const inv2 = await db.invoice.create({ data: { number: `INV-${timestamp}-002`, totalAmount: 16800, status: "pending", dueDate: daysAgo(-14), customerId: customers[4].id, dealId: deals[5].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv2.id, productId: products[0].id, quantity: 1, unitPrice: 12000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv2.id, productId: products[6].id, quantity: 1, unitPrice: 4800 } });

  const inv3 = await db.invoice.create({ data: { number: `INV-${timestamp}-003`, totalAmount: 55000, status: "overdue", dueDate: daysAgo(7), customerId: customers[2].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv3.id, productId: products[2].id, quantity: 1, unitPrice: 35000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv3.id, productId: products[0].id, quantity: 1, unitPrice: 12000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv3.id, productId: products[5].id, quantity: 1, unitPrice: 6000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv3.id, productId: products[3].id, quantity: 0.25, unitPrice: 2000 } });

  const inv4 = await db.invoice.create({ data: { number: `INV-${timestamp}-004`, totalAmount: 8000, status: "draft", dueDate: daysAgo(-30), customerId: customers[1].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv4.id, productId: products[3].id, quantity: 1, unitPrice: 8000 } });

  const inv5 = await db.invoice.create({ data: { number: `INV-${timestamp}-005`, totalAmount: 47500, status: "paid", dueDate: daysAgo(-3), customerId: customers[3].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv5.id, productId: products[4].id, quantity: 0.5, unitPrice: 27500 } });
  await db.invoiceItem.create({ data: { invoiceId: inv5.id, productId: products[6].id, quantity: 2, unitPrice: 4800 } });
  await db.invoiceItem.create({ data: { invoiceId: inv5.id, productId: products[1].id, quantity: 2, unitPrice: 2500 } });
  await db.invoiceItem.create({ data: { invoiceId: inv5.id, productId: products[5].id, quantity: 2, unitPrice: 5000 } });
  await db.payment.create({ data: { invoiceId: inv5.id, amount: 47500, paymentMethod: "payment_gateway", date: daysAgo(3) } });

  // Additional invoices
  const inv6 = await db.invoice.create({ data: { number: `INV-${timestamp}-006`, totalAmount: 88000, status: "pending", dueDate: daysAgo(-20), customerId: customers[8].id, dealId: deals[9].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv6.id, productId: products[4].id, quantity: 1, unitPrice: 55000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv6.id, productId: products[8].id, quantity: 1, unitPrice: 15000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv6.id, productId: products[9].id, quantity: 1, unitPrice: 12000 } });
  await db.payment.create({ data: { invoiceId: inv6.id, amount: 44000, paymentMethod: "bank_transfer", date: daysAgo(5) } });

  const inv7 = await db.invoice.create({ data: { number: `INV-${timestamp}-007`, totalAmount: 65000, status: "pending", dueDate: daysAgo(-10), customerId: customers[9].id, dealId: deals[10].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv7.id, productId: products[7].id, quantity: 2, unitPrice: 18000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv7.id, productId: products[10].id, quantity: 1, unitPrice: 9600 } });
  await db.invoiceItem.create({ data: { invoiceId: inv7.id, productId: products[11].id, quantity: 1, unitPrice: 22000 } });

  const inv8 = await db.invoice.create({ data: { number: `INV-${timestamp}-008`, totalAmount: 150000, status: "paid", dueDate: daysAgo(0), customerId: customers[10].id, dealId: deals[11].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv8.id, productId: products[4].id, quantity: 1, unitPrice: 55000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv8.id, productId: products[8].id, quantity: 2, unitPrice: 15000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv8.id, productId: products[9].id, quantity: 2, unitPrice: 12000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv8.id, productId: products[10].id, quantity: 1, unitPrice: 9600 } });
  await db.invoiceItem.create({ data: { invoiceId: inv8.id, productId: products[1].id, quantity: 12, unitPrice: 2500 } });
  await db.payment.create({ data: { invoiceId: inv8.id, amount: 75000, paymentMethod: "bank_transfer", date: daysAgo(15) } });
  await db.payment.create({ data: { invoiceId: inv8.id, amount: 75000, paymentMethod: "bank_transfer", date: daysAgo(2) } });

  const inv9 = await db.invoice.create({ data: { number: `INV-${timestamp}-009`, totalAmount: 22000, status: "overdue", dueDate: daysAgo(14), customerId: customers[2].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv9.id, productId: products[11].id, quantity: 1, unitPrice: 22000 } });

  const inv10 = await db.invoice.create({ data: { number: `INV-${timestamp}-010`, totalAmount: 75000, status: "draft", dueDate: daysAgo(-45), customerId: customers[12].id, dealId: deals[13].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv10.id, productId: products[4].id, quantity: 1, unitPrice: 55000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv10.id, productId: products[7].id, quantity: 1, unitPrice: 20000 } });

  const inv11 = await db.invoice.create({ data: { number: `INV-${timestamp}-011`, totalAmount: 180000, status: "pending", dueDate: daysAgo(-60), customerId: customers[13].id, dealId: deals[14].id } });
  await db.invoiceItem.create({ data: { invoiceId: inv11.id, productId: products[4].id, quantity: 2, unitPrice: 55000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv11.id, productId: products[8].id, quantity: 2, unitPrice: 15000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv11.id, productId: products[9].id, quantity: 2, unitPrice: 12000 } });
  await db.invoiceItem.create({ data: { invoiceId: inv11.id, productId: products[10].id, quantity: 1, unitPrice: 9600 } });
  await db.payment.create({ data: { invoiceId: inv11.id, amount: 60000, paymentMethod: "payment_gateway", date: daysAgo(25) } });

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

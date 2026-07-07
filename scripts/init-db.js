const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const existingProducts = await prisma.product.count();

  if (existingProducts > 0) {
    console.log('Database already contains data. Skipping seed.');
    return;
  }

  console.log('Seeding database with starter data...');

  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Website Template - Corporate', price: 12000, description: 'Modern corporate website template with CMS' } }),
    prisma.product.create({ data: { name: 'Maintenance Plan - Monthly', price: 2500, description: 'Monthly maintenance and security updates' } }),
    prisma.product.create({ data: { name: 'E-commerce Setup', price: 35000, description: 'Full e-commerce store setup with payment integration' } }),
    prisma.product.create({ data: { name: 'SEO Audit Report', price: 8000, description: 'Comprehensive SEO audit with recommendations' } }),
    prisma.product.create({ data: { name: 'Mobile App - Basic', price: 55000, description: 'Cross-platform mobile app (iOS + Android)' } }),
    prisma.product.create({ data: { name: 'Logo & Brand Identity', price: 6000, description: 'Logo design + brand guidelines' } }),
    prisma.product.create({ data: { name: 'Hosting - Annual', price: 4800, description: 'Annual managed cloud hosting' } }),
  ]);

  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Alpha Trading Co.', email: 'info@alphatrading.com', phone: '+20 100 123 4567', status: 'active', source: 'website' } }),
    prisma.customer.create({ data: { name: 'Bright Solutions LLC', email: 'contact@brightsolutions.io', phone: '+20 101 234 5678', status: 'lead', source: 'referral' } }),
    prisma.customer.create({ data: { name: 'Cairo Retail Group', email: 'hello@cairet.com', phone: '+20 102 345 6789', status: 'active', source: 'social_media' } }),
    prisma.customer.create({ data: { name: 'Delta Manufacturing', email: 'procurement@deltamfg.com', phone: '+20 103 456 7890', status: 'new', source: 'ads' } }),
    prisma.customer.create({ data: { name: 'Echo Media House', email: 'team@echomedia.com', phone: '+20 104 567 8901', status: 'active', source: 'website' } }),
    prisma.customer.create({ data: { name: 'Future Tech Startup', email: 'founders@futuretech.io', phone: '+20 105 678 9012', status: 'lead', source: 'referral' } }),
    prisma.customer.create({ data: { name: 'Giza Properties', email: 'sales@gizaprops.com', phone: '+20 106 789 0123', status: 'inactive', source: 'other' } }),
    prisma.customer.create({ data: { name: 'Horizon Logistics', email: 'ops@horizonlog.com', phone: '+20 107 890 1234', status: 'new', source: 'social_media' } }),
  ]);

  const deals = await Promise.all([
    prisma.deal.create({ data: { title: 'Corporate Website Redesign', value: 45000, stage: 'negotiation', customerId: customers[0].id } }),
    prisma.deal.create({ data: { title: 'Annual Maintenance Contract', value: 30000, stage: 'won', customerId: customers[0].id } }),
    prisma.deal.create({ data: { title: 'E-commerce Platform', value: 80000, stage: 'proposal', customerId: customers[1].id } }),
    prisma.deal.create({ data: { title: 'Retail POS Integration', value: 55000, stage: 'contact', customerId: customers[2].id } }),
  ]);

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000);

  await Promise.all([
    prisma.interaction.create({ data: { content: 'Initial discovery call. Client needs a full website redesign with new branding.', date: daysAgo(3), type: 'call', customerId: customers[0].id } }),
    prisma.interaction.create({ data: { content: 'Sent revised proposal with 3 tier options.', date: daysAgo(1), type: 'email', customerId: customers[0].id } }),
    prisma.interaction.create({ data: { content: 'Demo call went well. Interested in POS + inventory sync.', date: daysAgo(2), type: 'call', customerId: customers[2].id } }),
  ]);

  const inv1 = await prisma.invoice.create({ data: { number: 'INV-0001', totalAmount: 30000, status: 'paid', dueDate: daysAgo(-5), customerId: customers[0].id, dealId: deals[1].id } });
  await prisma.invoiceItem.create({ data: { invoiceId: inv1.id, productId: products[1].id, quantity: 12, unitPrice: 2500 } });

  const inv2 = await prisma.invoice.create({ data: { number: 'INV-0002', totalAmount: 16800, status: 'pending', dueDate: daysAgo(-14), customerId: customers[4].id } });
  await prisma.invoiceItem.create({ data: { invoiceId: inv2.id, productId: products[0].id, quantity: 1, unitPrice: 12000 } });
  await prisma.invoiceItem.create({ data: { invoiceId: inv2.id, productId: products[6].id, quantity: 1, unitPrice: 4800 } });

  await prisma.payment.create({ data: { invoiceId: inv1.id, amount: 15000, paymentMethod: 'bank_transfer', date: daysAgo(8) } });

  console.log('Seed complete.', { products: products.length, customers: customers.length, deals: deals.length });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

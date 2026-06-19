import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Create Admin User ───────────────────────────────────
  const adminPassword = await hash("Admin@2024", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@state-immocom.com" },
    update: {},
    create: {
      email: "admin@state-immocom.com",
      name: "State ImmoCom Admin",
      password: adminPassword,
      role: "ADMIN",
      phone: "+233 20 000 0001",
      company: "State-ImmoCom",
      bio: "Platform administrator with full access to manage all resources.",
    },
  });

  // ─── Create Agent Users ──────────────────────────────────
  const agentPassword = await hash("Agent@2024", 12);

  const agents = await Promise.all(
    [
      {
        email: "kwame@state-immocom.com",
        name: "Kwame Asante",
        phone: "+233 20 111 2222",
        company: "GoldKey Realty",
        license: "GH-RL-2024-001",
        bio: "Experienced real estate agent specializing in luxury homes in East Legon and Airport Residential.",
      },
      {
        email: "ama@state-immocom.com",
        name: "Ama Mensah",
        phone: "+233 20 333 4444",
        company: "Accra Prime Properties",
        license: "GH-RL-2024-002",
        bio: "Specialist in commercial properties and office spaces across Accra.",
      },
      {
        email: "kofi@state-immocom.com",
        name: "Kofi Boateng",
        phone: "+233 20 555 6666",
        company: "HomeFind Ghana",
        license: "GH-RL-2024-003",
        bio: "Residential property expert covering Cantonments, Roman Ridge, and Dzorwulu.",
      },
    ].map((data) =>
      prisma.user.upsert({
        where: { email: data.email },
        update: {},
        create: { ...data, password: agentPassword, role: "AGENT" },
      })
    )
  );

  // ─── Create Properties ───────────────────────────────────
  const properties = [
    {
      title: "Luxury 4-Bedroom Villa with Pool",
      slug: "luxury-4bed-villa-east-legon",
      description: "Stunning modern villa in the heart of East Legon featuring spacious living areas, a private swimming pool, landscaped garden, and 24/7 security. This property offers premium finishes including marble flooring, a gourmet kitchen with granite countertops, and a rooftop terrace with panoramic city views. Perfect for families seeking elegance and comfort in one of Accra's most prestigious neighborhoods.",
      price: 2500000,
      location: "East Legon, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "VILLA",
      status: "AVAILABLE",
      listingType: "SALE",
      bedrooms: 4,
      bathrooms: 3,
      area: 450,
      furnished: false,
      parking: true,
      pool: true,
      gym: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      ]),
      featured: true,
      agentId: agents[0].id,
    },
    {
      title: "Modern 3-Bedroom Apartment",
      slug: "modern-3bed-apartment-airport-residential",
      description: "Contemporary apartment in Airport Residential Area with high-end finishes, open-plan living, and stunning views. Features include a modern kitchen, spacious bedrooms with built-in wardrobes, and access to a shared gym and pool. Located minutes from Kotoka International Airport and major shopping centers.",
      price: 850000,
      location: "Airport Residential, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "APARTMENT",
      status: "AVAILABLE",
      listingType: "SALE",
      bedrooms: 3,
      bathrooms: 2,
      area: 180,
      furnished: true,
      parking: true,
      pool: true,
      gym: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
      ]),
      featured: true,
      agentId: agents[0].id,
    },
    {
      title: "Executive Office Space in Cantonments",
      slug: "executive-office-cantonments",
      description: "Premium Grade-A office space in Cantonments with modern facilities, high-speed internet, dedicated parking, and 24/7 security. Ideal for corporate headquarters, tech startups, or professional services firms. The building features a reception area, conference rooms, and a rooftop lounge.",
      price: 15000,
      location: "Cantonments, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "OFFICE",
      status: "AVAILABLE",
      listingType: "RENT",
      bedrooms: null,
      bathrooms: 2,
      area: 320,
      furnished: true,
      parking: true,
      pool: false,
      gym: false,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
      ]),
      featured: false,
      agentId: agents[1].id,
    },
    {
      title: "5-Bedroom Family Home in Roman Ridge",
      slug: "5bed-family-home-roman-ridge",
      description: "Spacious family home in the serene Roman Ridge neighborhood. This property features five generous bedrooms, a large living and dining area, a modern kitchen, a lush garden, and a boys' quarters. The home is located near top international schools and embassies, making it ideal for expatriate families.",
      price: 3200000,
      location: "Roman Ridge, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "HOUSE",
      status: "AVAILABLE",
      listingType: "SALE",
      bedrooms: 5,
      bathrooms: 4,
      area: 550,
      furnished: false,
      parking: true,
      pool: true,
      gym: false,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      ]),
      featured: true,
      agentId: agents[2].id,
    },
    {
      title: "Stylish 2-Bedroom Penthouse",
      slug: "2bed-penthouse-dzorwulu",
      description: "Luxurious penthouse in Dzorwulu with panoramic views, modern design, and premium amenities. Features an open-concept living space, chef's kitchen, two ensuite bedrooms, and a private rooftop terrace. Building amenities include a gym, pool, and concierge service.",
      price: 4500,
      location: "Dzorwulu, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "APARTMENT",
      status: "AVAILABLE",
      listingType: "RENT",
      bedrooms: 2,
      bathrooms: 2,
      area: 160,
      furnished: true,
      parking: true,
      pool: true,
      gym: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
      ]),
      featured: true,
      agentId: agents[0].id,
    },
    {
      title: "Commercial Land in Tema",
      slug: "commercial-land-tema",
      description: "Prime commercial land parcel in Tema, ideal for retail, warehousing, or mixed-use development. The property has excellent road frontage and is situated in a rapidly developing industrial and commercial zone with easy access to the Tema Port and the Accra-Tema Motorway.",
      price: 1800000,
      location: "Tema, Greater Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "LAND",
      status: "AVAILABLE",
      listingType: "SALE",
      bedrooms: null,
      bathrooms: null,
      area: 2000,
      furnished: false,
      parking: false,
      pool: false,
      gym: false,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
      ]),
      featured: false,
      agentId: agents[1].id,
    },
    {
      title: "Cozy 1-Bedroom Apartment in Osu",
      slug: "1bed-apartment-osu",
      description: "Charming one-bedroom apartment in vibrant Osu, walking distance from Oxford Street restaurants, bars, and shops. Perfect for young professionals or as a rental investment. Features modern finishes, air conditioning, and a balcony with street views.",
      price: 2800,
      location: "Osu, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "APARTMENT",
      status: "AVAILABLE",
      listingType: "RENT",
      bedrooms: 1,
      bathrooms: 1,
      area: 65,
      furnished: true,
      parking: false,
      pool: false,
      gym: false,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
      ]),
      featured: false,
      agentId: agents[2].id,
    },
    {
      title: "3-Bedroom Townhouse in Trasacco Valley",
      slug: "3bed-townhouse-trasacco-valley",
      description: "Elegant townhouse in the exclusive Trasacco Valley estate. This gated community offers 24/7 security, communal gardens, a clubhouse, and a swimming pool. The townhouse features three bedrooms, a modern kitchen, spacious living areas, and a private garden.",
      price: 1500000,
      location: "Trasacco Valley, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "HOUSE",
      status: "AVAILABLE",
      listingType: "SALE",
      bedrooms: 3,
      bathrooms: 3,
      area: 280,
      furnished: false,
      parking: true,
      pool: true,
      gym: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
      ]),
      featured: true,
      agentId: agents[0].id,
    },
    {
      title: "Warehouse & Office Complex in Spintex",
      slug: "warehouse-office-spintex",
      description: "Modern warehouse with integrated office space in the Spintex industrial area. Features high ceilings, loading docks, ample parking, and three-phase power. The office area is air-conditioned with boardroom and kitchen facilities. Ideal for import/export businesses or manufacturing.",
      price: 8000,
      location: "Spintex Road, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "COMMERCIAL",
      status: "AVAILABLE",
      listingType: "RENT",
      bedrooms: null,
      bathrooms: 2,
      area: 800,
      furnished: false,
      parking: true,
      pool: false,
      gym: false,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800",
      ]),
      featured: false,
      agentId: agents[1].id,
    },
    {
      title: "4-Bedroom Semi-Detached in Dansoman",
      slug: "4bed-semi-detached-dansoman",
      description: "Well-maintained semi-detached house in Dansoman offering four bedrooms, a spacious compound, and a self-contained boys' quarters. Located in a family-friendly neighborhood with access to schools, churches, and markets. Great value for families looking for space and comfort.",
      price: 650000,
      location: "Dansoman, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "HOUSE",
      status: "AVAILABLE",
      listingType: "SALE",
      bedrooms: 4,
      bathrooms: 3,
      area: 300,
      furnished: false,
      parking: true,
      pool: false,
      gym: false,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
      ]),
      featured: false,
      agentId: agents[2].id,
    },
    {
      title: "Luxury 2-Bed Serviced Apartment",
      slug: "luxury-2bed-serviced-labone",
      description: "Fully serviced luxury apartment in Labone with hotel-like amenities including daily housekeeping, a rooftop infinity pool, gym, and concierge services. Features designer interiors, Miele appliances, and a private balcony overlooking the Accra skyline.",
      price: 5500,
      location: "Labone, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "APARTMENT",
      status: "AVAILABLE",
      listingType: "RENT",
      bedrooms: 2,
      bathrooms: 2,
      area: 140,
      furnished: true,
      parking: true,
      pool: true,
      gym: true,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
      ]),
      featured: true,
      agentId: agents[0].id,
    },
    {
      title: "Residential Plot in East Legon Hills",
      slug: "residential-plot-east-legon-hills",
      description: "Prime residential plot in the fast-developing East Legon Hills area. The land is walled and gated with proper documentation and title deeds. Ideal for building a custom dream home in a serene, well-planned community with tarred roads and street lighting.",
      price: 350000,
      location: "East Legon Hills, Accra",
      city: "Accra",
      region: "Greater Accra",
      type: "LAND",
      status: "AVAILABLE",
      listingType: "SALE",
      bedrooms: null,
      bathrooms: null,
      area: 700,
      furnished: false,
      parking: false,
      pool: false,
      gym: false,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        "https://images.unsplash.com/photo-1628624747186-a941c476b7ef?w=800",
      ]),
      featured: false,
      agentId: agents[2].id,
    },
  ];

  for (const prop of properties) {
    await prisma.property.upsert({
      where: { slug: prop.slug },
      update: {},
      create: prop,
    });
  }

  // ─── Create Sample Messages ──────────────────────────────
  const sampleMessages = [
    {
      senderName: "John Mensah",
      senderEmail: "john.mensah@gmail.com",
      senderPhone: "+233 24 567 8901",
      subject: "Inquiry about East Legon Villa",
      body: "Hello, I am interested in the Luxury 4-Bedroom Villa in East Legon. Could you please provide more details about the payment plan and if there is room for negotiation? I am looking to move in by Q2 2025.",
      isRead: false,
      agentId: agents[0].id,
    },
    {
      senderName: "Sarah Johnson",
      senderEmail: "sarah.j@outlook.com",
      senderPhone: "+233 20 123 4567",
      subject: "Viewing Request - Airport Residential Apartment",
      body: "Hi, I would like to schedule a viewing for the Modern 3-Bedroom Apartment in Airport Residential. I am available this weekend. Please let me know what times work for you.",
      isRead: true,
      agentId: agents[0].id,
    },
    {
      senderName: "David Osei",
      senderEmail: "david.osei@yahoo.com",
      senderPhone: "+233 27 987 6543",
      subject: "Office Space Inquiry",
      body: "Good day, I represent a tech startup looking for office space in Cantonments. We need approximately 200-300 sqm. Can you share the lease terms for the Executive Office Space?",
      isRead: false,
      agentId: agents[1].id,
    },
    {
      senderName: "Abena Darkwah",
      senderEmail: "abena.d@gmail.com",
      senderPhone: "+233 50 246 8135",
      subject: "Family Home in Roman Ridge",
      body: "I am looking for a family home near international schools. The 5-Bedroom home in Roman Ridge looks perfect. Is it possible to arrange a virtual tour as I am currently based in London?",
      isRead: false,
      agentId: agents[2].id,
    },
    {
      senderName: "Michael Chen",
      senderEmail: "m.chen@globalcorp.com",
      senderPhone: "+1 555 123 4567",
      subject: "Corporate Relocation - Penthouse",
      body: "My company is relocating me to Accra next month. I am interested in the Stylish 2-Bedroom Penthouse in Dzorwulu. Can you provide details on the lease duration options and what is included in the monthly rent?",
      isRead: true,
      agentId: agents[0].id,
    },
  ];

  // Get property IDs for linking messages
  const allProperties = await prisma.property.findMany();
  for (let i = 0; i < sampleMessages.length; i++) {
    const msg = sampleMessages[i];
    await prisma.message.create({
      data: {
        ...msg,
        propertyId: allProperties[i % allProperties.length].id,
      },
    });
  }

  // ─── Create Sample Visits ────────────────────────────────
  const sampleVisits = [
    {
      visitorName: "James Owusu",
      visitorEmail: "j.owusu@gmail.com",
      visitorPhone: "+233 24 111 2222",
      visitDate: new Date("2025-01-15T10:00:00Z"),
      status: "COMPLETED",
      notes: "Client was impressed with the property. Will discuss with family and revert.",
      agentId: agents[0].id,
    },
    {
      visitorName: "Patricia Agyeman",
      visitorEmail: "p.agyeman@hotmail.com",
      visitorPhone: "+233 20 333 5555",
      visitDate: new Date("2025-01-20T14:00:00Z"),
      status: "SCHEDULED",
      notes: "Second viewing requested. Client wants to bring their architect.",
      agentId: agents[2].id,
    },
    {
      visitorName: "Robert Smith",
      visitorEmail: "r.smith@expat.com",
      visitorPhone: "+44 7700 900 123",
      visitDate: new Date("2025-01-18T09:00:00Z"),
      status: "COMPLETED",
      notes: "Expat client from UK. Very interested. Needs to confirm financing.",
      agentId: agents[0].id,
    },
    {
      visitorName: "Nana Ama McBrown",
      visitorEmail: "nana.ama@gmail.com",
      visitorPhone: "+233 54 777 8888",
      visitDate: new Date("2025-01-25T11:00:00Z"),
      status: "SCHEDULED",
      notes: null,
      agentId: agents[1].id,
    },
  ];

  for (let i = 0; i < sampleVisits.length; i++) {
    const visit = sampleVisits[i];
    await prisma.visit.create({
      data: {
        ...visit,
        propertyId: allProperties[i % allProperties.length].id,
      },
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log("   Admin: admin@state-immocom.com / Admin@2024");
  console.log("   Agent: kwame@state-immocom.com / Agent@2024");
  console.log("   Agent: ama@state-immocom.com / Agent@2024");
  console.log("   Agent: kofi@state-immocom.com / Agent@2024");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

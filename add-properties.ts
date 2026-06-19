const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const KWAME_ID = "cmpy5so9x0001oq48v545ibm8";

async function main() {
  console.log("Adding properties to database...");

  // MOD1: 2 Haatso Properties
  const apartment = await prisma.property.create({
    data: {
      title: "Modern 2-Bedroom Apartment at Haatso Methodist Junction",
      slug: "modern-2-bedroom-apartment-haatso-methodist-junction",
      description:
        "A beautifully modern 2-bedroom apartment located at the vibrant Haatso Methodist Junction. This fully furnished apartment offers contemporary living with quality finishes, air conditioning in every room, and a well-equipped kitchen. Enjoy the convenience of dedicated parking and easy access to public transport, shops, and restaurants. Perfect for professionals or small families looking for comfort and style in a prime Haatso location.",
      price: 2200,
      currency: "GHC",
      location: "Haatso Methodist Junction, Accra",
      city: "Accra",
      region: "Greater Accra",
      country: "Ghana",
      type: "APARTMENT",
      status: "AVAILABLE",
      listingType: "RENT",
      bedrooms: 2,
      bathrooms: 1,
      area: 85,
      furnished: true,
      parking: true,
      pool: false,
      gym: false,
      images: JSON.stringify([
        "/haatso-apartment.jpg",
        "/haatso-apartment-interior.jpg",
      ]),
      videos: JSON.stringify([]),
      featured: true,
      agentId: KWAME_ID,
    },
  });
  console.log("Created apartment:", apartment.id);

  const house = await prisma.property.create({
    data: {
      title: "Spacious 3-Bedroom House at Haatso Methodist Junction",
      slug: "spacious-3-bedroom-house-haatso-methodist-junction",
      description:
        "A spacious 3-bedroom house at Haatso Methodist Junction offering generous living space for families. This unfurnished home features large bedrooms, an open-concept living and dining area, and a well-sized kitchen. The property includes dedicated parking and a large compound area perfect for outdoor activities. Located in a peaceful neighborhood with easy access to main roads, schools, and commercial areas. An excellent choice for families seeking space and affordability.",
      price: 4000,
      currency: "GHC",
      location: "Haatso Methodist Junction, Accra",
      city: "Accra",
      region: "Greater Accra",
      country: "Ghana",
      type: "HOUSE",
      status: "AVAILABLE",
      listingType: "RENT",
      bedrooms: 3,
      bathrooms: 2,
      area: 150,
      furnished: false,
      parking: true,
      pool: false,
      gym: false,
      images: JSON.stringify([
        "/haatso-house.jpg",
        "/haatso-house-interior.jpg",
      ]),
      videos: JSON.stringify([]),
      featured: true,
      agentId: KWAME_ID,
    },
  });
  console.log("Created house:", house.id);

  // MOD2: Hotel & Hostel Properties
  const hotel = await prisma.property.create({
    data: {
      title: "Accra Boutique Hotel - Premium Rooms",
      slug: "accra-boutique-hotel-premium-rooms-osu",
      description:
        "Experience luxury at Accra Boutique Hotel in the heart of Osu. Our premium rooms feature elegant decor, king-size beds, and modern amenities including free Wi-Fi, flat-screen TVs, and minibar. Guests enjoy access to our rooftop swimming pool with stunning city views, a fully equipped fitness center, and complimentary breakfast each morning. Secure parking available. Located steps away from Osu's vibrant nightlife, restaurants, and shopping. Perfect for business travelers and tourists seeking premium accommodation in Accra.",
      price: 800,
      currency: "GHC",
      location: "Osu, Accra",
      city: "Accra",
      region: "Greater Accra",
      country: "Ghana",
      type: "HOTEL",
      status: "AVAILABLE",
      listingType: "RENT",
      bedrooms: 1,
      bathrooms: 1,
      area: 45,
      furnished: true,
      parking: true,
      pool: true,
      gym: true,
      images: JSON.stringify(["/accra-boutique-hotel.jpg"]),
      videos: JSON.stringify([]),
      featured: true,
      agentId: KWAME_ID,
    },
  });
  console.log("Created hotel:", hotel.id);

  const guesthouse = await prisma.property.create({
    data: {
      title: "Cozy Guest House in East Legon",
      slug: "cozy-guest-house-east-legon",
      description:
        "A charming and cozy guest house nestled in the prestigious East Legon neighborhood. This fully furnished property features comfortable bedrooms, a well-appointed living area, and a beautiful garden perfect for relaxation. Enjoy secure parking, 24/7 security, and a peaceful environment. The guest house is within walking distance of East Legon's finest restaurants, cafes, and shopping centers. Ideal for expats, visiting professionals, or families seeking a home-away-from-home experience in one of Accra's most sought-after areas.",
      price: 2500,
      currency: "GHC",
      location: "East Legon, Accra",
      city: "Accra",
      region: "Greater Accra",
      country: "Ghana",
      type: "HOSTEL",
      status: "AVAILABLE",
      listingType: "RENT",
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      furnished: true,
      parking: true,
      pool: false,
      gym: false,
      images: JSON.stringify(["/east-legon-guesthouse.jpg"]),
      videos: JSON.stringify([]),
      featured: true,
      agentId: KWAME_ID,
    },
  });
  console.log("Created guest house:", guesthouse.id);

  const hostel = await prisma.property.create({
    data: {
      title: "Backpackers Hostel Accra",
      slug: "backpackers-hostel-accra-adabraka",
      description:
        "Welcome to Backpackers Hostel Accra — the city's favorite budget accommodation for travelers and adventurers! Located in the lively Adabraka neighborhood, our hostel offers both dormitory-style and private rooms at affordable rates. Enjoy free high-speed Wi-Fi throughout the property, a shared kitchen for self-catering, and a vibrant common area perfect for meeting fellow travelers. We organize weekly social activities, city tours, and cultural experiences. Our friendly staff can help you plan your Accra adventure. Clean, safe, and social — that's the Backpackers way!",
      price: 120,
      currency: "GHC",
      location: "Adabraka, Accra",
      city: "Accra",
      region: "Greater Accra",
      country: "Ghana",
      type: "HOSTEL",
      status: "AVAILABLE",
      listingType: "RENT",
      bedrooms: 1,
      bathrooms: 1,
      area: 20,
      furnished: true,
      parking: false,
      pool: false,
      gym: false,
      images: JSON.stringify(["/backpackers-hostel.jpg"]),
      videos: JSON.stringify([]),
      featured: true,
      agentId: KWAME_ID,
    },
  });
  console.log("Created hostel:", hostel.id);

  console.log("\nAll 5 properties added successfully!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

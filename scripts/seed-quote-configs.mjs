import "dotenv/config";
import { PrismaClient, ExtraPricingType } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  ),
});

const pricing = {
  semipermanente: {
    label: "Gel Semipermanente",
    multiSelect: false,
    options: [
      { label: "Largo 1", price: 180 },
      { label: "Largo 2", price: 200 },
      { label: "Largo 3", price: 200 },
      { label: "Largo 4", price: 220 },
      { label: "Largo 5", price: 220 },
      { label: "Largo 6", price: 240 },
      { label: "Largo 7", price: 250 },
    ],
  },
  softgel: {
    label: "Soft Gel",
    multiSelect: false,
    options: [
      { label: "XS", price: 200 },
      { label: "S", price: 230 },
      { label: "M", price: 260 },
      { label: "L", price: 290 },
    ],
  },
  presson: {
    label: "Press On",
    multiSelect: false,
    options: [
      { label: "XS", price: 200 },
      { label: "S", price: 230 },
      { label: "M", price: 260 },
      { label: "L", price: 300 },
    ],
  },
  retiro: {
    label: "Retiro",
    multiSelect: true,
    options: [
      { label: "Gel Semipermanente", price: 40 },
      { label: "Soft Gel", price: 50 },
      { label: "Acrílicas", price: 60 },
      { label: "Pedrería o Relieve", price: 10 },
    ],
  },
};

const extras = [
  {
    name: "Tonos extra",
    price: 2,
    includedQuantity: 2,
    metadata: { sourceKey: "extra_tones", displayGroup: "tones", captureMode: "individual", unitLabel: "tono" },
  },
  {
    name: "Pedrería",
    price: 5,
    includedQuantity: 0,
    metadata: { displayGroup: "decorations", captureMode: "individual", unitLabel: "detalle" },
  },
  {
    name: "Relieve",
    price: 10,
    includedQuantity: 0,
    metadata: { displayGroup: "decorations", captureMode: "individual", unitLabel: "detalle" },
  },
  {
    name: "Hoja metalica",
    price: 2,
    includedQuantity: 0,
    metadata: { displayGroup: "decorations", captureMode: "individual", unitLabel: "detalle" },
  },
  {
    name: "Efecto Espejo",
    price: 5,
    includedQuantity: 0,
    metadata: { displayGroup: "decorations", captureMode: "individual", unitLabel: "detalle" },
  },
  {
    name: "Efecto Arcoíris",
    price: 5,
    includedQuantity: 0,
    metadata: { displayGroup: "decorations", captureMode: "individual", unitLabel: "detalle" },
  },
  {
    name: "Efecto Aurora",
    price: 5,
    includedQuantity: 0,
    metadata: { displayGroup: "decorations", captureMode: "individual", unitLabel: "detalle" },
  },
  { name: "Relleno", price: 2, includedQuantity: 0, metadata: null },
  {
    name: "Reposición",
    price: 10,
    includedQuantity: 0,
    metadata: { captureMode: "individual", unitLabel: "uña" },
  },
  { name: "Dijes", price: 10, includedQuantity: 0, metadata: null },
  {
    name: "Stickers",
    price: 2,
    includedQuantity: 0,
    metadata: { displayGroup: "decorations", captureMode: "individual", unitLabel: "detalle" },
  },
  {
    name: "Naturaleza muerta",
    price: 2,
    includedQuantity: 0,
    metadata: { displayGroup: "decorations", captureMode: "individual", unitLabel: "detalle" },
  },
];

async function main() {
  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  for (const organization of organizations) {
    const existing = await prisma.organizationConfig.findUnique({
      where: {
        organizationId: organization.id,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      continue;
    }

    await prisma.organizationConfig.create({
      data: {
        organizationId: organization.id,
        businessName: organization.name,
        businessType: "nail_salon",
        logoUrl: "/logo.png",
        primaryColor: "#1f2937",
        secondaryColor: "#fffaf4",
        currency: "MXN",
        language: "es-MX",
        serviceCategories: {
          create: Object.values(pricing).map((category, categoryIndex) => ({
            name: category.label,
            multiSelect: category.multiSelect,
            sortOrder: categoryIndex,
            options: {
              create: category.options.map((option, optionIndex) => ({
                name: option.label,
                price: option.price,
                sortOrder: optionIndex,
              })),
            },
          })),
        },
        extraOptions: {
          create: extras.map((extra, extraIndex) => ({
            name: extra.name,
            price: extra.price,
            includedQuantity: extra.includedQuantity,
            pricingType: ExtraPricingType.PER_UNIT,
            sortOrder: extraIndex,
            metadata: extra.metadata,
          })),
        },
        businessRules: {
          create: {
            maxSelectedCategories: 2,
            maxQuantityPerExtra: 10,
          },
        },
        uiConfig: {
          create: {
            titles: {
              calculatorTitle: "Calculadora de cotizaciones",
              calculatorSubtitle: "Configura servicios y extras según tu negocio.",
              servicesTitle: "Servicios",
              extrasTitle: "Extras",
              summaryTitle: "Resumen",
            },
            texts: {
              servicesHelper: "Selecciona las opciones que quieres incluir.",
              extrasHelper: "Ajusta extras y cantidades según el cliente.",
              emptySummary: "Selecciona al menos un servicio para comenzar.",
            },
            labels: {
              total: "Total",
              reset: "Nueva cotización",
              download: "Descargar cotización",
            },
          },
        },
      },
    });

    console.log(`Seed OK: ${organization.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

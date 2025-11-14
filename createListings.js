import axios from "axios";

const productionIds = [
    5794523, 5794525, 5794529, 5794536, 5794535, 5794531,
    5974288, 5794540, 5794526, 5794528, 5794539, 5794537, 5794532
];

const template = {
    quantity: 1,
    section: "",
    row: "---",
    notes: "",
    electronic: false,
    electronicTransfer: true,
    listDate: new Date().toISOString(),
    splitType: "DEFAULT",
    spec: false,
    instantDownload: false,
    passThrough: "",
    stockType: "TMET",
    unitTaxedCost: 0,
    instantTransfer: false,
    attributes: [],
    tickets: [],
    internalNotes: "",
    state: "",
    cost: 0,
    hasFiles: false,
    hasBarcodes: false,
    priceCurrency: "USD",
    faceValueCurrency: "USD",
    unitTaxedCostCurrency: "USD",
    costCurrency: "USD"
};

const configurations = [
    { section: "SHORTSIDE UPPER", quantities: [1, 2, 3, 4], prices: [130, 150, 180, 180], faceValues: [100, 110, 130, 130] },
    { section: "LONGSIDE UPPER",  quantities: [1, 2, 3, 4], prices: [140, 160, 180, 190], faceValues: [100, 110, 130, 130] },
    { section: "LONGSIDE LOWER",  quantities: [1, 2, 3, 4], prices: [150, 170, 180, 200], faceValues: [110, 115, 130, 130] },
    { section: "SHORTSIDE LOWER", quantities: [1, 2, 3, 4], prices: [140, 160, 180, 180], faceValues: [100, 110, 130, 130] }
];

const listings = [];
(async () => {
    for (const productionId of productionIds) {
        for (const cfg of configurations) {
            for (let i = 0; i < cfg.quantities.length; i++) {
                listings.push({
                    productionId,
                    quantity: cfg.quantities[i],
                    section: cfg.section,
                    row: template.row,
                    notes: template.notes,
                    price: cfg.prices[i],
                    faceValue: cfg.faceValues[i],
                    electronic: template.electronic,
                    electronicTransfer: template.electronicTransfer,
                    listDate: template.listDate,
                    splitType: template.splitType,
                    spec: template.spec,
                    instantDownload: template.instantDownload,
                    passThrough: template.passThrough,
                    stockType: template.stockType,
                    unitTaxedCost: template.unitTaxedCost,
                    instantTransfer: template.instantTransfer,
                    attributes: [],
                    tickets: [],
                    internalNotes: "",
                    state: "",
                    cost: 0,
                    hasFiles: false,
                    hasBarcodes: false,
                    priceCurrency: "USD",
                    faceValueCurrency: "USD",
                    unitTaxedCostCurrency: "USD",
                    costCurrency: "USD"
                });
            }
        }
    }

    console.log(`✅ Total listings created: ${listings.length}`); // should be 156
    console.log(listings);
    let resp = await createListings(listings);
    console.log(resp);
})()

async function createListings(listings) {
    const url = "https://brokers.vividseats.com/webservices/listings/v2/create";
    const headers = {
        Accept: "application/json",
        "Api-token": "e87666c8-85bf-471a-93c5-00e78770df55",
        "Content-Type": "application/json"
    };

    const BATCH_SIZE = 50;
    const WAIT_MS = 1000; // 1 second between batches
    const results = [];

    for (let i = 0; i < listings.length; i += BATCH_SIZE) {
        const batch = listings.slice(i, i + BATCH_SIZE);
        console.log(`🚀 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} listings)`);

        const batchResults = await Promise.all(
            batch.map(async (listing) => {
                try {
                    const res = await axios.post(url, listing, { headers });
                    console.log(`✅ Created ${listing.section} (${listing.quantity})`);
                    return { listing, success: true, data: res.data };
                } catch (err) {
                    console.error(`❌ Failed ${listing.section} (${listing.quantity})`, err.response?.data || err.message);
                    return { listing, success: false, error: err.response?.data || err.message };
                }
            })
        );

        results.push(...batchResults);

        // Wait before sending next batch if not finished
        if (i + BATCH_SIZE < listings.length) {
            console.log(`⏳ Waiting ${WAIT_MS / 1000}s before next batch...`);
            await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
        }
    }

    console.log("🎯 All batches done!");
    return results;
}


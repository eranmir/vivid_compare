import axios from "axios";
import {botAccountToken} from "./consts.js";
import xml2js from "xml2js"; // to convert XML → JS object

/*5794431 brighton
5794445 wolves
5794437 leeds
5794432 burnley
5974308 qarbag
5794440 newcastle
5794438 man city
5794444 west ham
5794443 spurs
5794436 fulham
5794434 palace
5794433 chelsea
5794430 brentford*/
''
/*5786583 liverpool
5974378	dortmund
5786584 man city
5786586	 newcastle
5786571 arsenal
*/

const productionIds = [
    6480575
];

let apiToken = botAccountToken //bot account


const template = {
    quantity: 1,
    section: "",
    row: "Great",
    notes: "",
    electronic: false,
    electronicTransfer: true,
    listDate: new Date().toISOString(),
    splitType: "CUSTOM",
    splitValue: "",
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

const configurations =[
     { section: "BOBBY MOORE", quantities: [1, 2, 3, 4], prices: [4850, 4850, 4850, 4850], faceValues: [990, 999, 999, 999] },
]
     //{ section: "SHORTSIDE LOWER", quantities: [2], prices: [180], faceValues: [990] },
/* { section: "SHORTSIDE UPPER", quantities: [1, 2, 3, 4], prices: [850, 850, 850, 850], faceValues: [990, 999, 999, 999] },
 { section: "LONGSIDE UPPER",  quantities: [1, 2, 3, 4], prices:[880, 880, 850, 850], faceValues:[990, 999, 999, 999] },
 { section: "LONGSIDE CENTRAL UPPER",  quantities: [1, 2, 3, 4], prices:[900, 900, 900, 900], faceValues:[990, 999, 999, 999] },
 { section: "LONGSIDE CENTRAL LOWER",  quantities: [1, 2, 3, 4], prices:[900, 900, 900, 900], faceValues: [990, 999, 999, 999]},
 { section: "LONGSIDE LOWER",  quantities: [1, 2, 3, 4], prices:[950, 950, 950, 950], faceValues: [990, 999, 999, 999]},
 { section: "SHORTSIDE LOWER", quantities: [1, 2, 3, 4], prices: [950, 950, 950, 950], faceValues: [990, 999, 999, 999] },
 { section: "VIP PACKAGES", quantities: [1, 2, 3, 4], prices: [1670, 1400, 1500, 1500], faceValues:[990, 999, 999, 999] },
 { section: "CLUB LEVEL", quantities: [1, 2, 3, 4], prices: [1070, 1000, 1000, 1000], faceValues:[990, 999, 999, 999] },
 { section: "SHORTSIDE CLUB LEVEL", quantities: [1, 2, 3, 4], prices: [1070, 1000, 1000, 1000], faceValues:[990, 999, 999, 999] },
 { section: "LONGSIDE CLUB LEVEL", quantities: [1, 2, 3, 4], prices: [1270, 1100, 1100, 1100], faceValues:[990, 999, 999, 999] },
];*/
/*const configurations =[
     //{ section: "SHORTSIDE LOWER", quantities: [2], prices: [180], faceValues: [990] },
 { section: "LOWER LEVEL", quantities: [1, 2, 3, 4], prices: [850, 850, 850, 850], faceValues: [990, 999, 999, 999] },
 { section: "UPPER LEVEL",  quantities: [1, 2, 3, 4], prices:[850, 850, 850, 850], faceValues:[990, 999, 999, 999] },
 { section: "CLUB LEVEL",  quantities: [1, 2, 3, 4], prices:[850, 850, 880, 850], faceValues:[990, 999, 999, 999] },
 { section: "GOLD CIRCLE",  quantities: [1, 2, 3, 4,5,6,7,8,9,10], prices:[850, 850, 850, 850,850, 850, 850, 850,850,850], faceValues: [990, 999, 999, 999]},
 { section: "PITCH STANDING",  quantities: [1, 2, 3, 4,5,6,7,8,9,10], prices:[850, 850,850, 850,850, 850, 850, 850,850,850], faceValues: [990, 999, 999, 999]},
];*/
/*
const configurations =[
    //{ section: "SHORTSIDE LOWER", quantities: [2], prices: [180], faceValues: [990] },
    { section: "CLUB LEVEL", quantities: [1, 2, 3, 4], prices: [700, 700, 700, 700], faceValues: [400, 400, 400, 400] },
    { section: "LOWER LEVEL", quantities: [1, 2, 3, 4], prices: [700, 700, 700, 700], faceValues: [400, 400, 400, 400] },
    { section: "UPPER LEVEL", quantities: [1, 2, 3, 4], prices: [500, 500, 500, 500], faceValues: [400, 400, 400, 400] },
    { section: "STANDING REAR", quantities: [1, 2, 3, 4,5,6,7,8,9,10,11,12], prices: [ 400, 400, 400, 400,400, 400, 400, 400,400, 400, 400, 400], faceValues: [400, 400, 400, 400] },
    { section: "FRONT STANDING NORTH", quantities: [1, 2, 3, 4,5,6,7,8,9,10,11,12], prices: [400, 400, 400, 400,400, 400, 400, 400,400, 400, 400, 400], faceValues: [400, 400, 400, 400] },
    { section: "FRONT STANDING SOUTH", quantities: [1, 2, 3, 4,5,6,7,8,9,10,11,12], prices: [400, 400, 400, 400,400, 400, 400, 400,400, 400, 400, 400], faceValues: [400, 400, 400, 400] },
    { section: "SQUARE", quantities: [1, 2, 3, 4], prices: [1500, 5100, 1500, 2500], faceValues: [400, 400, 400, 400] },
    { section: "CIRCLE", quantities: [1, 2, 3, 4], prices: [1500, 1500, 1500, 2500], faceValues: [400, 400, 400, 400] },
    { section: "DISCO", quantities: [1, 2, 3, 4], prices: [1500, 1500, 1500, 2500], faceValues: [400, 400, 400, 400] },
    { section: "KISS", quantities: [1, 2, 3, 4], prices: [1500, 1500, 1500, 2500], faceValues: [400, 400, 400, 400] },
];
*/

/*
const configurations =[
    //{ section: "SHORTSIDE LOWER", quantities: [2], prices: [180], faceValues: [990] },
    { section: "General Admission Pitch - SRO", quantities: [1, 2, 3, 4], prices: [700, 700, 700, 700], faceValues: [400, 400, 400, 400] },
    { section: "Upper Level - Corner", quantities: [1, 2, 3, 4], prices: [700, 700, 700, 700], faceValues: [400, 400, 400, 400] },
    { section: "Lower Level - Sideline", quantities: [1, 2, 3, 4], prices: [1500, 1500, 1500, 1500], faceValues: [400, 400, 400, 400] },
    { section: "Upper Level - Endzone", quantities: [1, 2, 3, 4], prices: [ 1400, 1400, 1400, 1400,400, 400, 400, 400,400, 400, 400, 400], faceValues: [400, 400, 400, 400] },
    { section: "Upper Level - Sideline", quantities: [1, 2, 3, 4], prices: [1400, 1400, 1400, 1400,400, 400, 400, 400,400, 400, 400, 400], faceValues: [400, 400, 400, 400] },
    { section: "Middle Level - Sideline", quantities: [1, 2, 3, 4], prices: [1400, 1400, 1400, 1400,400, 400, 400, 400,400, 400, 400, 400], faceValues: [400, 400, 400, 400] },
    { section: "Middle Level - Corner", quantities: [1, 2, 3, 4], prices: [1500, 5100, 1500, 2500], faceValues: [400, 400, 400, 400] },
    { section: "Lower Level - Endzone", quantities: [1, 2, 3, 4], prices: [1500, 1500, 1500, 2500], faceValues: [400, 400, 400, 400] },
    { section: "Lower Level - Corner", quantities: [1, 2, 3, 4], prices: [1500, 1500, 1500, 2500], faceValues: [400, 400, 400, 400] },
    { section: "Middle Level - Endzone", quantities: [1, 2, 3, 4], prices: [1500, 1500, 1500, 2500], faceValues: [400, 400, 400, 400] },
    { section: "Suites", quantities: [1, 2, 3, 4], prices: [8500, 8500, 8500, 8500], faceValues: [400, 400, 400, 400] },
    { section: "GA South Pitch", quantities: [1, 2, 3, 4,5,6,7,8,9,10], prices: [1400, 1400, 1400, 1400,1400, 1400, 1400, 1400,1400, 1400, 1400, 1400], faceValues: [400, 400, 400, 400] },
    { section: "GA North Pitch", quantities: [1, 2, 3, 4,5,6,7,8,9,10], prices:[1400, 1400, 1400, 1400,1400, 1400, 1400, 1400,1400, 1400, 1400, 1400], faceValues: [400, 400, 400, 400] },
    { section: "GA East Pitch", quantities: [1, 2, 3, 4,5,6,7,8,9,10], prices:[1400, 1400, 1400, 1400,1400, 1400, 1400, 1400,1400, 1400, 1400, 1400], faceValues: [400, 400, 400, 400] },
    { section: "GA West Pitch", quantities: [1, 2, 3, 4,5,6,7,8,9,10], prices:[1400, 1400, 1400, 1400,1400, 1400, 1400, 1400,1400, 1400, 1400, 1400], faceValues: [400, 400, 400, 400] },
];
*/

/*const configurations = [
    { section: "SHORTSIDE UPPER", quantities: [1, 2, 3, 4], prices: [130, 150, 180, 180], faceValues: [100, 110, 130, 130] },
    { section: "LONGSIDE UPPER",  quantities: [1, 2, 3, 4], prices: [140, 160, 180, 190], faceValues: [100, 110, 130, 130] },
    { section: "LONGSIDE LOWER",  quantities: [1, 2, 3, 4], prices: [150, 170, 180, 200], faceValues: [110, 115, 130, 130] },
    { section: "SHORTSIDE LOWER", quantities: [1, 2, 3, 4], prices: [140, 160, 180, 180], faceValues: [100, 110, 130, 130] }
];*/

async function refillOrders() {
    let listings = [];
    let orders = await getPendingShipmentOrders();
   // let complete  = orders.concat(await getCompletedShipmentOrders());
   // orders.slice(25, orders.length);
    for (let order of orders) {
        const eventDate = new Date(order.eventDate);
        eventDate.setDate(eventDate.getDate());
        listings.push({
            productionId: order.productionId,
            quantity: order.quantity,
            section: order.section,
            row: order.row,
            notes: order.notes,
            inHandDate: eventDate.toISOString(),
            price: order.cost,
            faceValue: "999",
            electronic: template.electronic,
            electronicTransfer: template.electronicTransfer,
            listDate: template.listDate,
            splitType: template.splitType,
            splitValue: order.quantity,
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

    console.log(`✅ Total listings created: ${listings.length}`); // should be 156
    console.log(listings);
    let resp = await createListings(listings);
    console.log(resp);
}

(async () => {
    await refillOrders();
    const listings = [];
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
                    splitValue: cfg.quantities[i],
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


async function getPendingShipmentOrders() {
    const url = "https://brokers.vividseats.com/webservices/v1/getOrders";

    try {
        const response = await axios.get(url, {
            params: {
                apiToken: apiToken,
                status: "PENDING_SHIPMENT"    // REQUIRED: choose one of the allowed statuses
            },
            headers: {
                "Accept": "application/xml"
            }
        });

        // Convert XML → JS object
        const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });
        return result.orders.order;

    } catch (error) {
        console.log("STATUS:", error.response?.status);
        console.log("DATA:", error.response?.data);
        console.log("MESSAGE:", error.message);
        return null;
    }
}

async function getCompletedShipmentOrders() {
    const url = "https://brokers.vividseats.com/webservices/v1/getCompletedOrders";

    try {
        const response = await axios.get(url, {
            params: {
                apiToken: apiToken,
            },
            headers: {
                "Accept": "application/xml"
            }
        });

        // Convert XML → JS object
        const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });
        return result.orders.order;

    } catch (error) {
        console.log("STATUS:", error.response?.status);
        console.log("DATA:", error.response?.data);
        console.log("MESSAGE:", error.message);
        return null;
    }
}


async function createListings(listings) {
    const url = "https://brokers.vividseats.com/webservices/listings/v2/create";
    const headers = {
        Accept: "application/json",
        "Api-token": apiToken,
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


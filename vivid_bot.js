import {stadiums} from "./consts.js";
import fs from 'fs/promises';
import FormDataPackage from 'form-data';

import {
    clearEvents, getAllListings, getEventsWithListings, getMyListings, saveEventsToFile, sendTelegramMessage
} from "./shared/utils.js";
import axios from "axios";

const FormData = FormDataPackage; // 🔧 prevent collision with global

async function createNewTicket(client, events) {
     await Promise.all(events.flatMap(event =>
        event.listingsToFix.map(async (listing) => {
            let myListing =  event.myListings.find((list) => list.ticketId === listing.ticket_id);
            let originalPrice = listing.price;
            listing.price = myListing?.cheapestPrice;
            if (myListing && typeof myListing === 'object') {
                myListing.price = listing.price;
            }

            try {
                const form = new FormData();
                for (const [key, value] of Object.entries(listing)) {
                    form.append(key, value);
                }

                const response = await client.post(
                    'https://www.footballticketnet.com/supplier-information/create-new_ticket',
                    form,
                    {
                        headers: {
                            ...form.getHeaders(),
                            'User-Agent': 'Mozilla/5.0',
                            'x-requested-with': 'XMLHttpRequest',
                            'Referer': 'https://www.footballticketnet.com/supplier-information?action=exchange_panel',
                        }
                    }
                );
                let message = `updated ${event.name} section ${myListing.category} for ${myListing.customAmount} from ${originalPrice} to ${listing.price}`
                console.log(message);
                await sendTelegramMessage(message)

                return {success: true, ticket_id: listing.ticket_id, status: response.status};
            } catch (err) {
                console.error(`Failed to post ticket ${listing.ticket_id}:`, err.message);
                return {success: false, ticket_id: listing.ticket_id, error: err.message};
            }
        })
    ));
    events = clearEvents(events);
    await saveEventsToFile(events)
}

function findCheapestPrices(events) {
    const qMatches = (myQ, otherQ) => {
        if (myQ === undefined || otherQ === undefined) return false;
        myQ = Number(myQ);
        otherQ = Number(otherQ);
        if (Number.isNaN(myQ) || Number.isNaN(otherQ)) return false;

        if (myQ === 1) return true;
        if (myQ === 2) return otherQ !== 1;
        if (myQ === 3) return otherQ === 3 || otherQ > 4;
        if (myQ === 4) return otherQ === 4 || otherQ > 4;
        if (myQ > 4) return otherQ > 4;
        return false;
    };

    return events.map((event) => {
        const their = event.theirListingsToCompare || [];
        const my = event.myListingsToCompare || [];

        const augmentedMy = my.map((myListing) => {
            const myD = myListing.d;
            const myQ = Number(myListing.q);

            // Filter their listings to same d and matching q rule
            const candidates = their.filter((other) => {
                if (other.d !== myD) return false;
                return qMatches(myQ, Number(other.q));
            });

            // Extract numeric prices (other.p) and find min
            const prices = candidates
                .map(o => {
                    const p = Number(o.p);
                    return Number.isFinite(p) ? p : null;
                })
                .filter(p => p !== null);

            const cheapestPrice = prices.length > 0 ? Math.min(...prices) : null;
            const difference = (cheapestPrice !== null) ? (Number(myListing.p) - cheapestPrice) : null;
            return {
                ...myListing,
                cheapestPrice,
                difference
            };
        });

        return {
            ...event,
            myListingsToCompare: augmentedMy
        };
    });
}

/*
function findCheapestPricesold(events) {
    return events.map((event) => {
        let myOffers = event.listings;
        let otherOffers = event.allMatchListings;
        event.myListings = myOffers?.map(myOffer => {
            const currStadium = stadiums.get(event.stadium);
            const mySection = myOffer.category;
            const myCustomAmount = myOffer.customAmount;
            const myRelevantSeatingCategory = mySection;
            const myRelevantBlock = mySection.indexOf('-') !== -1 ? mySection.split('-')[0].trim() : null
            let myCentralLevel = myRelevantBlock !== null ? currStadium?.get(myRelevantBlock) : 100;
            let theirCentralLevel;
            let theirRelevantSeatingCategory
            let theirRelevantBlock;
            let relevantOffers = otherOffers.filter(offer => {
                theirRelevantSeatingCategory = offer.category;
                // theirRelevantBlock = offer.section.indexOf('-') !== -1 ? offer.section.split('-')[0].trim() : null;
                theirCentralLevel = theirRelevantBlock !== null ? currStadium?.get(theirRelevantBlock) : 100;

                // if (myCentralLevel === 100 || myCentralLevel >= theirCentralLevel || myCentralLevel === undefined || myCentralLevel === null) {
                return theirRelevantSeatingCategory.split("Row")[0].trim() === myRelevantSeatingCategory.split("Row")[0].trim();
                // }
            });

            /!*   if (!myOffer.isRestricted) {
                   relevantOffers = relevantOffers.filter(offer => !offer.isRestricted);
               }

               if (!myOffer.isJuniors) {
                   relevantOffers = relevantOffers.filter(offer => !offer.isJuniors);
               }
               if (!myOffer.isAdultJuniors && !myOffer.isJuniors) {
                   relevantOffers = relevantOffers.filter(offer => !offer.isAdultJuniors);
               }*!/

            let filteredOffers = relevantOffers.filter(offer => {
                const otherCustomAmount = offer.customAmount;
                switch (myCustomAmount) {
                    case "1 Seated Together":
                        return true;
                    case "Connecting":
                        return otherCustomAmount !== "1 Seated Together";
                    case "2 Seated Together":
                        return otherCustomAmount !== "1 Seated Together" && otherCustomAmount !== "Connecting";
                    case "3 Seated Together":
                        return otherCustomAmount === "3 Seated Together" || otherCustomAmount === "5 Seated Together" || (otherCustomAmount === "4 Seated Together" && offer.quantities.includes(3));
                    case "4 Seated Together":
                        return otherCustomAmount === "4 Seated Together" || (otherCustomAmount === "5 Seated Together" && offer.quantities.includes(4));
                    case "5 Seated Together":
                        return otherCustomAmount === "3 Seated Together" || otherCustomAmount === "5 Seated Together";
                    default:
                        return false; // In case of unexpected customAmount
                }
            });

            let prices = filteredOffers.map(offer => offer.price);
            prices.sort((a, b) => a - b);

            // Find the cheapest price among the filtered offers
            let cheapestPrice;
            let secondCheapest;
            if (prices.length > 0)
                cheapestPrice = prices[0];

            if (prices.length > 1)
                secondCheapest = prices[1];

           /!* if (cheapestPrice && secondCheapest && secondCheapest - cheapestPrice > 974.99) {
                cheapestPrice = secondCheapest
            }*!/
            if (!cheapestPrice) {
                filteredOffers = relevantOffers.filter(offer => {
                    const otherCustomAmount = offer.customAmount;
                    switch (myCustomAmount) {
                        case "1 Seated Together":
                            return true; // Compare with all
                        case "2 Seated Together":
                        case "3 Seated Together":
                        case "4 Seated Together":
                        case "5 Seated Together":
                            return otherCustomAmount !== "1 Seated Together" && otherCustomAmount !== "Connecting";
                        case "Connecting":
                            return otherCustomAmount !== "1 Seated Together";
                        default:
                            return false; // In case of unexpected customAmount
                    }
                });

                cheapestPrice = Math.min(...filteredOffers.map(offer => offer.price));
            }
            let newPrice;
            if ((myOffer.price < cheapestPrice) && cheapestPrice - myOffer.price < 2) {
                newPrice = myOffer.price;
            } else {
                //let deduction = myOffer.isRestricted ? (Math.random() * (4.5 - 3.5)) + 3.5 : (Math.random() * (1 - 0.01)) + 0.01;
                let deduction = (Math.random() * (1 - 0.01)) + 0.01;
                newPrice = cheapestPrice - deduction;
                newPrice = Math.floor(newPrice * 10) / 10;
            }

            return {
                ...myOffer,
                cheapestPrice: isFinite(newPrice) ? newPrice : null // Return null if no valid offers found
            };
        });
        return event;
    })
}
*/

// javascript
function getOffersToFix(events = [])  {
    const didNotUpdateMessages = [];
    const offersToFix = [];

    const updatedEvents = (events || []).map((event) => {
        const myListings = event.listings || []; // your original listings
        const myCompare = event.myListingsToCompare || []; // augmented compare objects (have .difference)

        const eventOffersToFix = [];

        for (const cmp of myCompare) {
            const numericId = cmp.i?.startsWith("VB") ? String(cmp.i.slice(2)) : String(cmp.i);
            const myListing = myListings.find(l => String(l.id) === numericId);

            if (!myListing) {
                didNotUpdateMessages.push(`Missing my listing ${numericId} for event ${event.eventId || event.eventName || event.name || 'unknown'}`);
                continue;
            }

            const diff = Number(cmp.difference);
            if (!Number.isFinite(diff) || (diff < 0 && diff > -5)) continue;

            const origPrice = Number(myListing.price);
            if (!Number.isFinite(origPrice)) continue;

            let newPrice =  Math.floor(origPrice - diff - 2)
            newPrice -= Math.abs(newPrice * .01)

            const faceValue = Number(myListing.faceValue ?? 0);

            // Add to offersToFix only if newPrice is greater than facevalue
            if (Number.isFinite(newPrice) && newPrice > faceValue) {
                const offer = {
                    ...myListing,
                    newPrice: newPrice, // small extra deduction to ensure undercut
                };
                eventOffersToFix.push(offer);
                offersToFix.push(offer);
            }
        }

        return {
            ...event,
            offersToFix: eventOffersToFix
        };
    });

    return {
        events: updatedEvents,
        didNotUpdateMessages,
        offersToFix
    };
}


/*async function separateListings(events) {
    return events.map(event => {
        const myIds = new Set(event.listings.map(l => String(l.id))); // store all your listing IDs as strings

        const myListingsToCompare = [];
        const theirListingsToCompare = [];

        for (const listing of event.allListings || []) {
            // extract numeric id from i (remove "VB")
            const numericId = listing.i?.startsWith("VB") ? listing.i.slice(2) : listing.i;

            if (myIds.has(numericId)) {
                myListingsToCompare.push(listing);
            } else {
                theirListingsToCompare.push(listing);
            }
        }

        return {
            ...event,
            myListingsToCompare,
            theirListingsToCompare
        };
    });
}*/
async function separateListings(events) {
    const updatedEvents = [];
    const notFoundListings = []; // collect all missing ones here

    for (const event of events) {
        const myIds = new Set(event.listings.map(l => String(l.id)));

        const myListingsToCompare = [];
        const theirListingsToCompare = [];
        const foundMyIds = new Set(); // track which of my ids were matched

        for (const listing of event.allListings || []) {
            const numericId = listing.i?.startsWith("VB") ? listing.i.slice(2) : listing.i;

            if (myIds.has(numericId)) {
                myListingsToCompare.push(listing);
                foundMyIds.add(numericId);
            } else {
                theirListingsToCompare.push(listing);
            }
        }

        // Find which of my listings were NOT found in allListings
        const missing = event.listings.filter(l => !foundMyIds.has(String(l.id)));
        if (missing.length > 0) {
            notFoundListings.push(...missing);
        }

        updatedEvents.push({
            ...event,
            myListingsToCompare,
            theirListingsToCompare
        });
    }

    // Add synthetic event for all missing ones (if any)
    if (notFoundListings.length > 0) {
        updatedEvents.push({
            eventId: "not_found",
            eventName: "Listings not found in allListings",
            listings: notFoundListings
        });
    }

    return updatedEvents;
}

async function updateListings(offers = []) {
    const BATCH_SIZE = 50;
    const WAIT_MS = 1000;
    const headers = {
        Accept: "application/json",
        "Api-token": "e87666c8-85bf-471a-93c5-00e78770df55",
        "Content-Type": "application/json"
    };

    const url = "https://brokers.vividseats.com/webservices/listings/v2/update";
    const results = [];

    for (let i = 0; i < (offers || []).length; i += BATCH_SIZE) {
        const batch = offers.slice(i, i + BATCH_SIZE);
        console.log(`🚀 Processing batch ${i / BATCH_SIZE + 1} (${batch.length} listings)`);

        const batchResults = await Promise.all(batch.map(async (listing) => {
            const newPrice = Number(listing.newPrice);
            if (!Number.isFinite(newPrice)) {
                console.warn(`Skipping ${listing.id}: invalid newPrice`, listing.newPrice);
                return { id: listing.id, success: false, error: "invalid newPrice" };
            }

            const data = {
                id: listing.id,
                productionId: listing.productionId,
                // keep row as-is (do not modify)
                row: listing.row,
                section: listing.section,
                // only change the price to newPrice
                price: newPrice,
                splitType: listing.splitType,
                stockType: listing.stockType ?? "TMET",
                quantity: listing.quantity,
            };

            try {
                const res = await axios.put(url, data, { headers });
                console.log(`✅ Updated ${listing.id} -> ${data.price}`);
                return { id: listing.id, success: true, data: res.data };
            } catch (err) {
                console.error(`❌ Failed ${listing.id}`, err.response?.data || err.message);
                return { id: listing.id, success: false, error: err.response?.data || err.message };
            }
        }));

        results.push(...batchResults);

        if (i + BATCH_SIZE < offers.length) {
            console.log(`⏳ Waiting ${WAIT_MS / 1000}s before next batch...`);
            await new Promise((r) => setTimeout(r, WAIT_MS));
        }
    }

    console.log("🎯 All done!");
    return results;
}

async function updateRowListings(listing) {
    const headers = {
        Accept: "application/json",
        "Api-token": "e87666c8-85bf-471a-93c5-00e78770df55",
        "Content-Type": "application/json"
    };
   // listing.price = 5000;
    let row = "---";
    if(listing.section.includes("VIP") || listing.section.includes("002") || listing.section.includes("003") || listing.section.includes("BOX")) {
        row = "VIP"
    } else if (listing.section.includes("AWAY")) {
        row = "AWAY";
    }
    const data = {
        id: listing.id,
        productionId: listing.productionId,
        row: row,
        section: listing.section,
        price: listing.price,
        splitType: listing.splitType,
        stockType: "TMET",
        quantity: listing.quantity,
    };
    const url = "https://brokers.vividseats.com/webservices/listings/v2/update";

    const response = await axios.put(url, data, { headers });

    return response
}

(async () => {
    await sendTelegramMessage("starting");
    let events = await getMyListings();
    //let n = await updateListings(eventss[0].listings[0])
    //let res = await updateAllListings(eventss);
    let allListings = await getAllListings(events);
    let separated = await separateListings(allListings);
    separated = findCheapestPrices(separated)
    let response = getOffersToFix(separated);
    await updateListings(response.offersToFix)
   /* events = response.events;
    let didNotUpdateMessages = response.didNotUpdateMessages;
    didNotUpdateMessages.forEach((x)=> console.log(x));
    await createNewTicket(client, events);
    await sendTelegramMessage("finished " + events.length + " events");*/
})();


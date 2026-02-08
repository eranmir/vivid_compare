import {CookieJar} from "tough-cookie";
import {wrapper} from "axios-cookiejar-support";
import axios from "axios";
import qs from "querystring";
import {createRequire} from "module";
import { HttpsProxyAgent } from 'https-proxy-agent';
const require = createRequire(import.meta.url);
const cheerio = require('cheerio');
import fs from 'fs/promises';
import crypto from "crypto";
const {Telegraf} = require("telegraf");
const tokens = [
    "1715620562:AAHjdYlA7qoUdZ1ObFHfYmMIArOOLsr1Seg",
    "7506546757:AAHUr73JoTiLFdm8PlxshRdd47-JHblSq4c",
    "6830020243:AAFDQQFx959SEEWDRdbq7Ie_Y8lpel70uTo",
    "7256121657:AAGPD5OrM_CUochVdJU__WnDXZRTKuRvy9g",
    "7757411028:AAGzo8QKYPfVvgLv3KZinknW3w2hUXhjdKc",
    "8125965826:AAGYwx59MfYNrg0KtG93xLFgtEmRusAyhh0",
    "6661820949:AAHES9Ge6jx2pVbKQKb_NQymNpGcfzhIolw",
    "1753359218:AAEEQA45GMMUT0AwoAFXFfjB-vhyZB-qzJc",
    "7151859168:AAFGlHaLtUgIMY3W_wElDWnUQvvGGKDssMU",
    "7479740003:AAHMTp7Fs06qbyaSpV0EIwVze7Qv-j61exI",
    "7855065912:AAFnEAQWInIkIOkWFG2vdI6Tc70puY1dsII",
    "7331854177:AAF95hbG6aI0hbMNiFW-1i5exIU79QkRLpE"
];
const chatId =-5096844319;

export async function sendTelegramMessage(message) {
    try {
        const index = crypto.randomInt(0, tokens.length);
        const randomToken = tokens[index];
        const bot = new Telegraf(randomToken);
        // await bot.telegram.sendMessage(didNotUpdateChatId, message);
        await bot.telegram.sendMessage(chatId, message);
    } catch (e) {
        console.log(e)
    }
}

export async function saveEventsToFile(events) {
    try {
        await fs.writeFile('events.json', JSON.stringify(events, null, 2), 'utf8');
        console.log(`✅ Saved ${events.length} events to events.json`);
    } catch (err) {
        console.error('❌ Failed to write events file:', err.message);
    }
}

export function clearEvents(events) {
    events.map(event => {event.allMatchListings = []})
    events.map(event => {event.listingsJsons = []})
    events.map(event => {event.listingsToFix = []})

    return events;
}

export async function login() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({jar, withCredentials: true}));

    let m = await client.post(
        'https://www.footballticketnet.com/supplier-information/login',
        qs.stringify({
            supplier_email: 'yuvalgor1357@gmail.com',
            supplier_password: 'EM10326597845023b6!'
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0',
                'x-requested-with': 'XMLHttpRequest',
                'Referer': 'https://www.footballticketnet.com/',
            },
            maxRedirects: 0,
            validateStatus: status => status < 400,
        }
    );

    return {client, jar}; // ✅ return both so we can extract cookies later
}

function categorizeSeating(events) {
    return events.map(event => {
        const updatedListings = event?.allMatchListings?.map(listing => {
            const quantities = listing.quantities || [];
            const maxQty = Math.max(...quantities, 0);
            const split = (listing.splitType || "").toLowerCase().trim();

            let category = "Unknown Configuration";

            if (split.includes("single") || maxQty === 1) {
                category = "1 Seated Together";
            } else if (split.includes("pair") || split.includes("2 seats") || maxQty === 2) {
                category = "2 Seated Together";
            } else if (split.includes("3 seats") && quantities.includes(3)) {
                category = "3 Seated Together";
            } else if (split.includes("4 seats") && quantities.includes(4)) {
                category = "4 Seated Together";
            } else if (split.includes("5 seats") || split.includes("6 seats") || split.includes("up to")) {
                // Extract "Up To X Seats Together"
                const match = split.match(/up to (\d+)/);
                const upTo = match ? parseInt(match[1]) : maxQty;

                // True capacity is limited by both splitType and quantity
                const seatedTogether = Math.min(upTo, maxQty);

                if (seatedTogether >= 5) {
                    category = "5 Seated Together";
                } else {
                    category = `${seatedTogether} Seated Together`;
                }
            } else {
                // No valid splitType, fallback to quantity
                if (maxQty >= 5) {
                    category = "5 Seated Together";
                } else if (maxQty === 4) {
                    category = "4 Seated Together";
                } else if (maxQty === 3) {
                    category = "3 Seated Together";
                } else if (maxQty === 2) {
                    category = "2 Seated Together";
                } else if (maxQty === 1) {
                    category = "1 Seated Together";
                }
            }

            return {...listing, customAmount: category};
        });

        return {...event, allMatchListings: updatedListings};
    });
}

function getRandomProxyAgent() {
    const proxy = proxyUrls[Math.floor(Math.random() * proxyUrls.length)];
    return new HttpsProxyAgent(proxy);
}

/*async function getAllListingsForMatch(events) {
    return await Promise.all(events.map(async (event) => {
        try {
            const res = await axios.post(
                "https://www.footballticketnet.com/premier-league/events_page/load_more_data",
                qs.stringify({
                    event_id: event.id,
                    page: 0,
                    show_more_event_listing: 1,
                    filter_qty: -1,
                    filter_type: -1,
                    filter_category: -1,
                    filter_seat_type: -1,
                    filter_hospitality: -1,
                    filter_price_from: 1,
                    filter_price_to: 75000000,
                    filter_block: "",
                    filter_sub_category_id: "",
                    filter_zone_block: "zone",
                    filter_fan_side: "all",
                    page_size: 20000000
                }),
                {
                    headers: {
                        "Accept": "*!/!*",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "X-Requested-With": "XMLHttpRequest",
                        "Referer": "https://www.footballticketnet.com/",
                        "Referrer-Policy": "strict-origin-when-cross-origin",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
                    },
                }
            );

            console.log('succeeded ' + event.id);

            return {
                ...event,
                allMatchListings: fixHtmlToListings(res.data.html)
            };
        } catch (err) {
            console.error(`❌ Failed to fe:tch match listings for event ${event.id}:`, err.message);
            await sendTelegramMessage(`❌ Failed to fetch match listings for event ${event.id}: ${err.message}`);
            return { ...event, allMatchListings: null };
        }
    }));
}*/

async function getEvents(client, jar) {
    const url = 'https://www.footballticketnet.com/supplier-information?action=exchange_panel';

    // ✅ Get full cookie string from the jar
    const cookie = await jar.getCookieString(url);

    const response = await client.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Cookie': cookie,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Referer': 'https://www.footballticketnet.com/',
        }
    });

    const events = [];
    const $ = cheerio.load(response.data);

    $('tr.event-header-row').each((_, el) => {
        const name = $(el).find('a').text().split('\n')[0].trim();
        const id = $(el).find('.event-expand').attr('data-event_id');
        const stadium = $(el).find('.venue_time_and_date').text().split('-')[1]?.trim();

        if (name && id && stadium) {
            events.push({ name, id, stadium });
        }
    });

    return events;
}

function fixHtmlToListings(html) {
    const $ = cheerio.load(html); // load your full page HTML

    const fixedListings = [];

    const listings = $('.stand_Sprice'); // skip first two listings

    listings.each((i, el) => {
        const $listing = $(el);
        const quantities = $listing.find('.inner_price').attr('data-qty-list').split('|')?.filter(Boolean).map(Number);
        const category = $listing.find('.extra_information_icon').text().split("Block")[0].trim();
        const blockText = $listing.find('.block-row').text();
        const block = blockText.includes(':') ? blockText.split(':')[1].split('\n')[0].split(';')[0].trim().split(',') : '';
        const ageGroup = $listing.find('.age_group').text().trim();
        const viewType = $listing.find('.view_type_text').text().trim();
        const splitType = $listing.find('.split_type_text').text().trim();
        const ticketId = $listing.find('.inner_price').attr('data-ticket');
        const price = parseFloat($listing.find('.prive').text().trim().substring(1).replace(",", ""));

        fixedListings.push({
            category,
            block,
            ageGroup,
            viewType,
            splitType,
            quantities,
            ticketId,
            price
        });
    });

    return fixedListings;
}

async function getListings(client, events) {
    return await Promise.all(events.map(async (event) => {
        try {
            const res = await client.post(
                "https://www.footballticketnet.com/supplier-information/get-event-listing?search=true&tab_name=listing&home_team_listing=&away_team_listing=&tournaments_listing=&activated_listing=0&date_from_listing=&date_to_listing=&ticket_types_listing=&sold_listing=0&restriction_listing=0&split_type_listing=&vip_tickets_listing=0",
                new URLSearchParams({event_id: event.id}).toString(),
                {
                    headers: {
                        "accept": "*/*",
                        "accept-language": "en-US,en;q=0.9",
                        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "x-requested-with": "XMLHttpRequest",
                        "Referer": "https://www.footballticketnet.com/supplier-information?action=exchange_panel",
                        "Referrer-Policy": "strict-origin-when-cross-origin",
                        "User-Agent": "Mozilla/5.0"
                    }
                }
            );

            const $ = cheerio.load(res.data.html || res.data); // handle either .html or raw HTML
            const listingsJsons = [];

            $('tr.ticket-row-tr').each((i, el) => {
                const $edit = $(el).find('a.edit_ticket');
                let eticket = 3;
                switch ($edit.attr('data-ticket_type')) {
                    case 'Mobile Tickets':
                        eticket = "3";
                        break;
                    case 'Electronic Tickets':
                        eticket = "1";
                        break;
                    case 'Physical Tickets':
                        eticket = "0";
                        break;
                }
                if ($edit.attr('data-ticket_activated') !== '0') {
                    listingsJsons.push({
                        event_id: $edit.attr('data-event_id'),
                        ticket_id: $edit.attr('data-ticket_id'),
                        category_id: $edit.attr('data-category_id'),
                        sub_category: $edit.attr('data-sub_category_id') || "0",
                        vip_sub_category: $edit.attr('data-vip_sub_category') || "undefined",
                        row: ($edit.attr('data-row') || "").replace(/<br\s*\/?>/gi, '|'),
                        block: ($edit.attr('data-block') || "").replace(/<br\s*\/?>/gi, '|'),
                        seat: "",
                        eticket: eticket,
                        view_type: $edit.attr('data-view_type') || "1",
                        split_type: $edit.attr('data-split_type') || "ANY",
                        age_group: $edit.attr('data-age_group') || "ADULT",
                        max_tickets: $edit.attr('data-max_tickets') || "1",
                        price: ($edit.attr('data-price') || "0").replace(/,/g, ""),
                        pairs: $edit.attr('data-singles') === "0" ? "1" : "0",
                        ticket_comment: $edit.attr('data-ticket_comment') || "",
                        activated: $edit.attr('data-ticket_activated') || "1",
                        adult_tickets: $edit.attr('data-adult_tickets') || "1",
                        senior_tickets: $edit.attr('data-senior_tickets') || "1",
                        junior_tickets: $edit.attr('data-junior_tickets') || "1",
                        fans_side: $edit.attr('data-fans_side') || "undefined",
                        instant_ticket: "0",
                        agency_sale: "1",
                        physical_option: 'data-physical_option' || "",
                        check_file_pkpass: "0",
                        check_file_qr: "0",
                        check_no_block: "1"
                    });
                }
            });
            // Attach to the original event
            return {...event, listingsJsons};
        } catch (err) {
            console.error(`Failed to fetch listings for event ${event.id}:`, err.message);
            await sendTelegramMessage(`Failed to fetch listings for event ${event.id}:, ${err.message}`);
            return {...event, listingJsons: []};
        }

    }));
}

async function enableSeasons(client) {
    await client.post(
        'https://www.footballticketnet.com/supplier_information/change_session_choose_season',
        qs.stringify({
            choose_season: '2024-2025|2025-2026|'
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0',
                'x-requested-with': 'XMLHttpRequest',
                'Referer': 'https://www.footballticketnet.com/supplier-information',
            },
            validateStatus: status => status < 400
        }
    );
}

 async function getAllListingsForMatch(matchId) {
   let m = await axios.get(`https://www.vividseats.com/hermes/api/v1/listings?productionId=${matchId}&includeIpAddress=true&currency=USD&localizeCurrency=true&priceGroupId=21`,);
    return m.data.tickets;
}

export async function getAllListings(events) {
    // Promise.all to run all requests in parallel
    const enriched = await Promise.all(
        events.map(async (event) => {
            try {
                let allListings = await getAllListingsForMatch(event.eventId);
                return {
                    ...event,
                    allListings, // new key added
                };
            } catch (err) {
                console.error(`❌ Failed to get listings for event ${event.eventId}`, err);
                return {
                    ...event,
                    allListings: [], // fallback
                    error: true
                };
            }
        })
    );

    return enriched;
}


export async function getMyListings(token) {
    const today = new Date().toISOString().split("T")[0]; // e.g. "2025-11-13"
    let myListings = await axios.get(`https://brokers.vividseats.com/webservices/listings/v2/get?fromEventDate=${today}`, {
        headers: {
        'api-token': token,
            accept: "application/json"
        }})
    let bigllistings = myListings.data.listings.filter((a)=>a.quantity >4)
    const groupedArray = Object.values(
        myListings.data.listings.reduce((acc, listing) => {
            const { productionId, eventName } = listing;

            if (!acc[productionId]) {
                acc[productionId] = {
                    eventId: productionId,
                    eventName,
                    listings: []
                };
            }

            acc[productionId].listings.push(listing);
            return acc;
        }, {})
    );


    return  groupedArray;
}

export async function getEventsWithListings() {
    const {client, jar} = await login();         // your login function (returns jar too)
    //await enableSeasons(client);                   // use the correct new endpoint
    let events = await getEvents(client, jar);
    events = await getListings(client, events);
    events = events.filter(event => Array.isArray(event.listingsJsons) && event.listingsJsons.length > 0);
    events = await getAllListingsForMatch(events);
    events = categorizeSeating(events);
    events.forEach((event) => {
        let myTicketIds = event.listingsJsons.map((listing) => listing.ticket_id);
        event.myListings = event.allMatchListings?.filter((matchListing) => myTicketIds.includes(matchListing.ticketId))
        event.allMatchListings = event.allMatchListings?.filter((matchListing) => !myTicketIds.includes(matchListing.ticketId))
    })

    return { events, client};
}
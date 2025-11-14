import {getEventsWithListings, saveEventsToFile, clearEvents} from "./shared/utils.js";

(async () => {
    let {events} = await getEventsWithListings()
    events = clearEvents(events);
    await saveEventsToFile(events);
})()

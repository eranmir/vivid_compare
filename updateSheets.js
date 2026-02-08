(async () => {
    let orders = await getPendingShipmentOrders();
    let complete  = orders.concat(await getCompletedShipmentOrders());
})()
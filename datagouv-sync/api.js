function ready(fn) {
  if (document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

function debug(message) {
  document.getElementById("debug").innerHTML += message + "<br>";
}

async function sync() {
  // debug("START...");
  const tableId = await grist.selectedTable.getTableId();
  const data = await grist.docApi.fetchTable(tableId);

  const env = tableId.toLowerCase() == "prod" ? "www" : "demo";
  const ids = [];
  const labels = [];
  const urls = [];

  for (const [i, id] of data.id.entries()) {
    const type = data.Type[i].trim().toLowerCase();
    if (type == "tag") continue;

    const identifier = data.Identifiant[i].trim();
    const object = `${type}s`
    const version = type == "topic" ? "2" : "1";
    debug(`id=${identifier}, object=${object}, version=${version}`);

    try {
      const response = await fetch(
        `https://${env}.data.gouv.fr/api/${version}/${object}/${identifier}/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Fields": "name,self_web_url,title,uri"
          }
        }
      );
      if (!response.ok) {
        console.warn(`[sync] API call failed for ${object}/${identifier}: ${response.status}`);
        // debug("KO");
        // TODO: flag row on error
        continue;
      }

      const result = await response.json();
      // fields used here must be declared in X-Fields request header
      const label = result.name || result.title || "<missing>";
      const url = result.uri || result.self_web_url || "<missing>";
      ids.push(id);
      labels.push(label);
      urls.push(url);
      // TODO: flag row if missing
      debug(`OK: label=${label}, url=${url}`)
    } catch (err) {
      console.error(`[sync] Error processing ${object}/${identifier}:`, err);
    }
  }

  if (ids.length > 0) {
    // debug("UPDATE");
    await grist.docApi.applyUserActions([
      ["BulkUpdateRecord", tableId, ids, { Label: labels, URL: urls }]
    ]);
    // debug(`Updated ${ids.length} rows.`)
    console.log(`[sync] Updated ${ids.length} rows.`);
  }
}

ready(() => {
  grist.ready({requiredAccess: "full"});
  // debug("READY");
});

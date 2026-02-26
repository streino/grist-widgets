function ready(fn) {
  if (document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

async function click(btn) {
  btn.innerHTML = '<span class="spinner"></span> Synchronisation';
  btn.disabled = true;

  await sync();

  btn.innerHTML = "Synchroniser";
  btn.disabled = false;
}

async function sync() {
  console.log(`DatagouvSync: Synchronising...`);

  const tableId = await grist.selectedTable.getTableId();
  const data = await grist.docApi.fetchTable(tableId);
  const env = tableId.toLowerCase() == "prod" ? "www" : "demo";

  const ids = [];
  const labels = [];
  const urls = [];

  for (const [i, id] of data.id.entries()) {
    const type = data.Type[i].trim().toLowerCase();
    if (type == "tag") {
      continue;
    }

    const identifier = data.Identifiant[i].trim();
    const object = `${type}s`
    const version = type == "topic" ? "2" : "1";

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
        console.warn(`DatagouvSync: API returned: ${response.statusText || response.status}`);
        continue;
      }

      // response fields used here must be declared in the X-Fields request header
      const result = await response.json();
      const label = result.name || result.title || "<missing>";
      const url = result.uri || result.self_web_url || "<missing>";
      ids.push(id);
      labels.push(label);
      urls.push(url);

      console.log(`DatagouvSync: Found ${object}/${identifier}: label="${label}", url=${url}`);
    } catch (err) {
      console.error(`DatagouvSync: Error processing ${object}/${identifier}:`, err);
    }
  }

  if (ids.length > 0) {
    try {
      await grist.docApi.applyUserActions([
        ["BulkUpdateRecord", tableId, ids, { Label: labels, URL: urls }]
      ]);
      console.log(`DatagouvSync: Updated ${ids.length} row(s)`);
    } catch (err) {
      console.error(`DatagouvSync: Failed to update table:`, err);
    }
  } else {
    console.log(`DatagouvSync: Nothing to update`);
  }
}

ready(() => {
  grist.ready({requiredAccess: "full"});
});

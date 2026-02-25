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
  debug("START!");
  const tableId = await grist.selectedTable.getTableId();
  debug(`tableId=${tableId}`);
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
          headers: {"Content-Type": "application/json", "X-Fields": "name,title,uri"}
        }
      );
      if (!response.ok) {
        console.warn(`API call failed for ${object}/${identifier}: ${response.status}`);
        debug("KO");
        continue;
      }

      const result = await response.json();
      const label = result.name || result.title;
      const url = result.uri;
      ids.push(id);
      labels.push(label);
      urls.push(url);
      debug(`OK: label=${label}, url=${url}`)
    } catch (err) {
      console.error(`Error processing row ${object}/${identifier}:`, err);
    }
  }

  if (ids.length > 0) {
    debug("UPDATE");
    await grist.docApi.applyUserActions([
      [
        "BulkAddOrUpdateRecord",
        tableId,
        ids,
        { "Label": labels, "URL": urls },
        {"on_many": "all", "add": false, "allow_empty_require": false}
      ]
    ]);
    console.log(`Updated ${ids.length} rows.`);
  }
}

ready(() => {
  grist.ready({
    requiredAccess: "full"
    // columns: [
    //   {
    //     name: "Action",
    //     title: "Opération à appliquer",
    //     type: "Choice",
    //     optional: false,
    //     allowMultiple: false
    //   },
    //   {
    //     name: "Type",
    //     title: "Type de l'entité",
    //     type: "Choice",
    //     optional: false,
    //     allowMultiple: false
    //   },
    //   {
    //     name: "Identifiant",
    //     title: "Identifiant de l'entité",
    //     type: "Text",
    //     optional: false,
    //     allowMultiple: false
    //   },
    //   {
    //     name: "Label",
    //     title: "Label de l'entité",
    //     type: "Text",
    //     optional: false,
    //     allowMultiple: false
    //   },
    //   {
    //     name: "URL",
    //     title: "URL data.gouv de l'entité",
    //     type: "Text",
    //     optional: true,
    //     allowMultiple: false
    //   }
    // ]
  });
  debug("READY");
});

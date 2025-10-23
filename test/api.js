const url_base = "https://www.data.gouv.fr/api/2/organizations/search/?lang=fr"
let page_size = 10;
let results;

// TODO: for tableId and mappings
// grist.on("message", (data) => {
//   if (data.tableId) {
//     tableId = data.tableId;
//   }
// });

function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function msg(message) {
  document.getElementById("info").innerHTML = message;
}

async function search() {
  try {
    msg("&nbsp;");

    const sr = document.getElementById('search-results');
    sr.innerHTML = ""

    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const url = `${url_base}&page_size=${page_size}&q=${query}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Fields': 'data{deleted,id,logo_thumbnail,metrics{dataservices,datasets},name,page},total'
      }
    });
    const contents = await response.json();
    msg(`Found ${contents.total} results, showing the first ${page_size} below.`)

    results = contents.data;
    // document.getElementById('debug').innerHTML = JSON.stringify(results);

    const existingIds = await grist
      .fetchSelectedTable({format: "columns", keepEncoded: true})
      .then((table) => {
        return table.identifier;
      })
      .catch((err) => {
        console.error(err);
        msg("Error: " + String(err));
      });

    // TODO: display metrics.datasets, metrics.dataservices
    // TODO: display badges[].kind ?
    // TODO: description as tooltip ?
    // TODO: display extras.siretisation:denomination_unite_legale ?

    results
      .filter((result) => !(result.deleted || existingIds.includes(result.id)))
      .forEach((result, index) => {
        sr.innerHTML +=
          `
          <div class="fr-grid-row fr-grid-row--middle">
            <span class="fr-mx-2w">
              <ul class="fr-btns-group fr-btns-group--inline fr-btns-group--equisized fr-btns-group--sm">
                <li>
                  <button class="fr-btn fr-btn--secondary fr-m-1v" onClick="add(${index}, 'organization', 'block')"> Block </button>
                </li>
                <li>
                  <button class="fr-btn fr-m-1v" onClick="add(${index}, 'organization', 'include')"> Include </button>
                </li>
              </ul>
            </span>
            <span class="fr-ml-1v">
              <img style="border: 1px solid lightgrey" src="${result.logo_thumbnail}" width="32" loading="lazy"/>
            </span>
            <span class="fr-mx-1v"> <a href="${result.page}"> ${result.name} </a> </span>
            <span class="fr-mx-1v"> [${result.id}] </span>
          </div>`;
      });

  } catch (err) {
    console.error(err);
    msg("Error: " + String(err));
  }
}

async function add(index, type, operation) {
  const result = results[index];
  msg(`${operation} ${index}: ${result.id}`)

  const tableId = await grist.getTable().getTableId();
  // FIXME: both grist.mapColumnNames() and grist.mapColumnNamesBack() return null trying to map record bellow...
  const record = {
    operation: operation,
    type: type,
    identifier: result.id,
    name: result.name,
    page: result.page
  };
  try {
    await grist.docApi.applyUserActions([
      ["AddRecord", tableId, null, record]
    ]);
    console.log("Row added successfully");
  } catch (error) {
    console.error("Error adding row:", error);
  }
}

ready(() => {
  grist.ready({
    requiredAccess: "full",
    columns: [
      {
        name: "operation",
        title: "Opération à appliquer",
        type: "Choice",
        optional: false,
        allowMultiple: false
      },
      {
        name: "type",
        title: "Type de l'entité",
        type: "Choice",
        optional: false,
        allowMultiple: false
      },
      {
        name: "identifier",
        title: "Identifiant de l'entité",
        type: "Text",
        optional: false,
        allowMultiple: false
      },
      {
        name: "name",
        title: "Nom de l'entité",
        type: "Text",
        optional: false,
        allowMultiple: false
      },
      {
        name: "page",
        title: "Page data.gouv de l'entité",
        type: "Text",
        optional: true,
        allowMultiple: false
      }
    ]
  });
});

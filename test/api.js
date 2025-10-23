const url_base = "https://www.data.gouv.fr/api/2/organizations/search/?page_size=10&lang=fr&q="
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

    const tbody = document.querySelector('#search-results tbody');
    tbody.innerHTML = ""

    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const url = url_base + query;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Fields': 'data{deleted,id,logo_thumbnail,metrics{dataservices,datasets},name,page},total'
      }
    });
    const contents = await response.json();
    msg(`Found ${contents.total} results`)

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
        tbody.innerHTML +=
          `<tr>
            <td class="fr-mx-1w centered">
              <div class="logo"> <img src="${result.logo_thumbnail}" loading="lazy" width="32"> </div>
              <span class="fr-ml-1w"> <a href="${result.page}">${result.name}</a> </span>
            </td>
            <td class="fr-mx-1w"> ${result.id} </td>
            <td class="fr-mx-1w">
              <ul class="fr-btns-group fr-btns-group--inline fr-btns-group--equisized fr-btns-group--sm">
                <li>
                  <button class="fr-btn" onClick="add(${index}, 'organization', 'include')"> Inclure </button>
                </li>
                <li>
                  <button class="fr-btn fr-btn--secondary" onClick="add(${index}, 'organization', 'block')"> Bloquer </button>
                </li>
              </ul>
            </td>
          </tr>`;
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

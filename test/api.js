const url_base = "https://www.data.gouv.fr/api/2/organizations/search/?page_size=21&lang=fr&q="
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
    const query = document.getElementById('search-input').value;
    const url = url_base + query;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Fields': 'data{deleted,id,logo_thumbnail,metrics{dataservices,datasets},name,page},total'
      }
    });
    const contents = await response.json();
    results = contents.data;
    msg(`Found ${results.total} results`)
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

    const tbody = document.querySelector('#search-results tbody');
    tbody.innerHTML = ""
    results
      .filter((result) => !(result.deleted || existingIds.includes(result.id)))
      .forEach((result, index) => {
        tbody.innerHTML +=
          `<tr>
            <td class="centered">
              <div border><img src="${result.logo_thumbnail}" loading="lazy" width="32"></div>
              <span class="padded"><a href="${result.page}">${result.name}</a></span></td>
            <td>${result.id}</td>
            <td>
              <button onClick="add(${index}, 'organization', 'include')">Inclure</button>
              <button onClick="add(${index}, 'organization', 'block')">Bloquer</button>
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

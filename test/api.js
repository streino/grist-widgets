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
        'X-Fields': 'data{id,logo_thumbnail,metrics,name,page,slug}'
      }
    });
    const contents = await response.json();
    results = contents.data;
    // document.getElementById('debug').innerHTML = JSON.stringify(results);

    // TODO: flag already added orgs

    const tbody = document.querySelector('#search-results tbody');
    tbody.innerHTML = ""
    results.forEach((result, index) => {
      tbody.innerHTML +=
        `<tr>
          <td class="centered">
            <div border><img src="${result.logo_thumbnail}" loading="lazy" width="32"></div>
            <span class="padded"><a href="${result.page}">${result.name}</a></span></td>
          <td>${result.id}</td>
          <td>
            <button onClick="add(${index}, 'include')">Inclure</button>
            <button onClick="add(${index}, 'block')">Bloquer</button>
          </td>
        </tr>`;
    });

  } catch (e) {
    console.error(e);
    msg("erreur : " + String(e));
  }
}

async function add(index, action) {
  const result = results[index];
  msg(`${action} ${index}: ${result.id}`)

  const tableId = await grist.getTable().getTableId();
  // FIXME: both grist.mapColumnNames() and grist.mapColumnNamesBack() return null trying to map record bellow...
  const record = {
    identifier: result.id,
    name: result.name,
    slug: result.slug
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
        name: "identifier",
        title: "Identifiant de l'organisation",
        type: "Text",
        optional: false,
        allowMultiple: false
      },
      {
        name: "name",
        title: "Nom de l'organisation",
        type: "Text",
        optional: false,
        allowMultiple: false
      },
      {
        name: "slug",
        title: "Slug de l'organisation",
        type: "Text",
        optional: true,
        allowMultiple: false
      }
    ]
  });
});

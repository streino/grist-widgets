const url_base = "https://www.data.gouv.fr/api/2/organizations/search/?page_size=21&lang=fr&q="
// let id_record = 0;
// let nbmax = 5;
// const minCar = 3;
// let qValide = true;
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
    // if (!qValide) {
    //   msg(`La requête doit comporter au moins ${minCar} caractères`);
    //   return;
    // }
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
  // TODO: cache?
  const tableId = await grist.widgetApi.getOption('tableId');
  const columns = await grist.widgetApi.getOption('columns');
  msg(`${action} ${index}: ${result.id}`)
  try {
    // FIXME: ensure grist access level
    await grist.docApi.applyUserActions([
      ['AddRecord', tableId, null, {
        [columns.id]: result.id,
        [columns.name]: result.name,
        [columns.slug]: result.slug
      }]
    ]);
    console.log('Row added successfully');
  } catch (error) {
    console.error('Error adding row:', error);
  }
}

ready(() => {
  grist.ready({
    requiredAccess: "full",
    columns: [
      {
        name: "id",
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

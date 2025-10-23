const url_base = "https://www.data.gouv.fr/api/2/organizations/search/?page_size=21&lang=fr&q="
// let id_record = 0;
// let nbmax = 5;
// const minCar = 3;
// let qValide = true;
let results;
const colsMap = { "ident": "ident", "name": "name", "slug": "slug" };
const columnsMappingOptions = [
  {
    name: "ident",
    title: "Identifiant de l'organisation",
    optional: false,
    allowMultiple: false
  },
  {
    name: "name",
    title: "Nom de l'organisation",
    optional: false,
    allowMultiple: false
  },
  {
    name: "slug",
    title: "Slug de l'organisation",
    optional: true,
    allowMultiple: false
  }
];

function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
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
        <td><img src="${result.logo_thumbnail}" width="32"> <a href="${result.page}">${result.name}</a></td>
        <td>${result.id}</td>
        <td><button onClick="add(${index}, 'include')">Inclure</button><button onClick="add(${index}, 'block')">Bloquer</button></td>
        </tr>`;
    });

  } catch (e) {
    console.error(e);
    msg("erreur : " + String(e));
  }
}

function add(index, action) {
  msg(`${action} ${index}: ${results[index].id}`)
}

// function maj_adresse(adresse) {
//   const objMaj = {};
//   objMaj[colsMap.numero] = adresse.numero;
//   objMaj[colsMap.nom_voie] = adresse.nom_voie;
//   objMaj[colsMap.code_postal] = adresse.code_postal;
//   objMaj[colsMap.ville] = adresse.ville;
//   if (colsMap.dept) objMaj[colsMap.dept] = adresse.dept;
//   if (colsMap.region) objMaj[colsMap.region] = adresse.region;
//   if (colsMap.x) objMaj[colsMap.x] = adresse.x;
//   if (colsMap.y) objMaj[colsMap.y] = adresse.y;

//   grist.docApi.applyUserActions([['UpdateRecord', "Adresses", id_record, objMaj]]).then(function (e) {
//     msg("maj ok");
//   }).catch(function (e) {
//     msg("erreur " + String(e));
//   });
// }

function msg(message) {
  document.getElementById("info").innerHTML = message;
}

// async function changeNbMax(e) {
//   nbmax = e.value;
//   await grist.setOption('nbmax', nbmax);
// }

// async function getNbMax() {
//   nbmax = await grist.getOption('nbmax') || 5;
//   var combo = document.getElementById("nbmax");
//   combo.value = nbmax;
// }

ready(function () {
  grist.ready({ requiredAccess: 'none', columns: columnsMappingOptions });
  grist.onRecords((table, mappings) => {
    getNbMax();
    colsMap.ident = mappings.ident;
    colsMap.name = mappings.name;
    colsMap.slug = mappings.slug;
  });
  grist.onRecord((record, mappings) => {
    // id_record = record.id;
    // let q = [];
    // if (record[mappings.numero].trim() != "") q.push(record[mappings.numero].trim());
    // if (record[mappings.nom_voie].trim() != "") q.push(record[mappings.nom_voie].trim());
    // if (record[mappings.code_postal]) q.push(record[mappings.code_postal]);
    // if (record[mappings.ville].trim() != "") q.push(record[mappings.ville].trim());
    // url = q.join("+").replace(/[ ]{1,2}/g, "+");
    // qValide = url.length >= minCar;
    // url = url_base + url;
    // document.getElementById("dump").innerHTML = url;
  });
});

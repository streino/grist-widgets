const url_base = "https://www.data.gouv.fr/api/2/organizations/search/?page_size=21&lang=fr&q="
// let id_record = 0;
// let nbmax = 5;
// const minCar = 3;
// let qValide = true;
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
        'X-Fields': 'data{id,name,slug}'
        // 'X-Fields': 'data{id,logo_thumbnail,metrics,name,page,slug}'
      }
    });
    const results = await response.json().data;
    // document.getElementById('debug').innerHTML = JSON.stringify(results);

    // const addressArray = result.features.map(feature => {
    //   const { housenumber, street, postcode, city, x, y, context, score } = feature.properties;
    //   const longlat = feature.geometry.coordinates;
    //   const lgt = longlat[0];
    //   const ltt = longlat[1];
    //   let buff = context.split(",");
    //   return {
    //     "numero": housenumber || "",
    //     "nom_voie": street,
    //     "code_postal": postcode,
    //     "ville": city,
    //     "x": lgt,
    //     "y": ltt,
    //     "dept": buff[1] ? buff[1].trim() : "",
    //     "region": buff[2] ? buff[2].trim() : "",
    //     "score": `<span class='${score > 0.7 ? "ok" : "ko"}'>${(score * 100).toFixed(1)}%</span>`
    //   };
    // });

    const tbody = document.querySelector('#search-results tbody');
    tbody.innerHTML = "";

    results.forEach((result, index) => {
      const row = document.createElement('tr');

      // row.addEventListener('click', () => {
      //   maj_adresse(result[index]);
      // });

      Object.keys(result).forEach(key => {
        const cell = document.createElement('td');
        cell.innerHTML = result[key];
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

  } catch (e) {
    console.error(e);
    msg("erreur : " + String(e));
  }
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

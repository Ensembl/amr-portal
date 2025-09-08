import http from 'k6/http';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { check } from 'k6';
import { group } from 'k6';

export const options = {
  vus: 1,
};

let hostName = 'http://amr.review.ensembl.org';

async function checkAMRAPI(hostName) {
  let host = '';
  let api_path = '';
  let endpoint = '';
  let url = '';
  let checksum = '';
  let genome_id = '';

  host = hostName;
  api_path = 'api';

  const filters_config = `${host}/${api_path}/filters-config`;
  group (`/filters_config`, function () {
    let filters_config_response = http.get(filters_config);

    try{
      check(filters_config_response, {
        [`is status 200`] : (r) => r.status === 200,
        [`contains genotype dataset`] : (r) => r.json().filterCategories["genotype-organism_name"]["dataset"] == "genotype",
      },
      );
    }
    finally{
      filters_config_response = null;
    }
  });

  const amr_records = `${host}/${api_path}/amr-records`;
  group (`/amr_records`, function () {
  let params = {
      headers: {
        Connection: `keep-alive`,
        "content-type": `application/json`,
        Accept: `*/*`,
      },
      cookies: {},
    };

   let resp = http.request(
      "POST",
      amr_records,
      JSON.stringify({
        "selected_filters": [
          { "category": "phenotype-genus", "value": "Streptococcus" },
          { "category": "phenotype-Antibiotic_abbreviation", "value": "OXA" },
          { "category": "phenotype-Antibiotic_abbreviation", "value": "AMK" }
        ],
        "view_id": 1,
        "order_by": {
          "category": "phenotype-collection_date",
          "order": "DESC"
        }
      }),
      params,
    );

    check(resp, { ["AMR records : status equals 200"]: (r) => r.status === 200,
                  [`has 4 number of hits `] : (r) => r.json().meta["total_hits"] == 4
                });

    resp = http.request(
      "POST",
      amr_records,
      JSON.stringify({
        "selected_filters": [
          { "category": "genotype-Contig_id", "value": "CQKJ01000001.1" },
          { "category": "genotype-Contig_id", "value": "DAFBZU010000245.1" }
        ],
        "view_id": 2,
        "order_by": {
          "category": "genotype-Contig_id",
          "order": "DESC"
        }
      }),
      params,
    );

    check(resp, { ["AMR genotype data : status equals 200"]: (r) => r.status === 200,
                  [`has 3 number of hits `] : (r) => r.json().meta["total_hits"] == 3
                });

    resp = http.request(
      "POST",
      amr_records,
      JSON.stringify({
        "selected_filters": [
          { "category": "phenotype-genus", "value": "Streptococcus" },
          { "category": "phenotype-Antibiotic_abbreviation", "value": "OXA" },
          { "category": "phenotype-Antibiotic_abbreviation", "value": "AMK" }
        ],
        "view_id": 1,
        "order_by": {
          "category": "phenotype-collection_date",
          "order": "DESC"
        }
      }),
      params,
    );

    check(resp, { ["AMR download : status equals 200"]: (r) => r.status === 200,
                });
  });
}

// This function generates an HTML report after the test completes
export function handleSummary(data) {
  return {
    'amr-smoke-test-summary.html': htmlReport(data),
    'amr-smoke-test-summary.json': JSON.stringify(data)
  };
}

export default async function () {
  if(__ENV.HOSTNAME != undefined){
    hostName = `${__ENV.HOSTNAME}`
  };
  await checkAMRAPI(hostName);
}
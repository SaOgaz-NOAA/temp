import * as path from 'path';
import * as os from 'os';
import Axios from 'axios';
import * as csv from 'csvtojson';
import { readFileSync, existsSync, writeFileSync, createWriteStream } from 'fs';

export async function authenticate(): Promise<Object> {
    let authUrl = 'https://www.nwfsc.noaa.gov/data/api/v1/external/login'
    let data: Object = {
        "username": "nmfs.nwfsc.fram.data.team+pacfin@noaa.gov",
        "password": REDACTED
    };
    const response = await Axios.post(authUrl, data);
    return response.data;
}

async function getTrawlSurveyHaulData(startYear: string, endYear: string)  {

    // Retrieve Trawl Survey Haul Characteristics data from FRAM Data Warehouse
    let baseUrl = "https://www.nwfsc.noaa.gov/data/api/v1/source/trawl.operation_haul_fact/selection.";
    let selectionType = "csv";  // "json"
    let variables = "latitude_hi_prec_dd,longitude_hi_prec_dd,tow_end_timestamp,tow_start_timestamp,trawl_id,vessel,sampling_start_hhmmss,sampling_end_hhmmss";
    let filters = "year>=" + startYear + ",year<=" + endYear;
    let dwUrl = baseUrl + selectionType + "?" + "filters=" + filters + "&" + "variables=" + variables;
    // console.info(`\tdwUrl = ${dwUrl}`);

    const desktopDir = path.join(os.homedir(), "Desktop");
    const haulsFile = path.join(desktopDir, "hauls." + selectionType);
    const csv=require('csvtojson');
    try {

        let authToken = await authenticate();
        console.log("flag1")
        let data: any;
        if (!existsSync(haulsFile)) {
            const response = await Axios.get(dwUrl, {
                headers: {
                    "Accept": "applicaiton/json",
                    "authorization": authToken
                }
            });
            data = response.data;
            if (selectionType === "json") {
                writeFileSync(haulsFile, JSON.stringify(data));
            } else {
                writeFileSync(haulsFile, data);
            }
            console.log(`\tdata retrieved successfully`);
        } else {
            if (selectionType === "csv") {
                data = await csv().fromFile(haulsFile);   // Convert csv to an array of JSON objects
            } else {
                data = readFileSync(haulsFile);
            }
        }
        console.log(`\thaul data successfully opened ...`);
        console.log(data);

    } catch (e) {
        console.log(`\tError in retrieving trawl survey haul data: ${e}`);
    }
}

async function runner() {
    let hauls = await getTrawlSurveyHaulData('2000', '2001');
}

runner();

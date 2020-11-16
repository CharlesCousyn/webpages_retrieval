import { from, of, ReplaySubject, partition} from 'rxjs'
import { filter, map, concatMap, tap, groupBy, reduce, mergeMap, mergeAll, toArray, take, bufferCount, count} from 'rxjs/operators'

import GENERAL_CONFIG from "./configFiles/generalConfig.json"
import filesSystem from "fs"
import {JSDOM} from "jsdom"

//Delete annoying message from jsdom errors (for testing only)
if(!GENERAL_CONFIG.prodMode)
{
	const originalConsoleError = console.error;
	console.error = function(msg)
	{
		if(msg.startsWith('Error: Could not parse CSS stylesheet')) return;
		originalConsoleError(msg);
	}
}

function timeConversion(ms)
{
	let seconds = (ms / 1000).toFixed(1);
	let minutes = (ms / (1000 * 60)).toFixed(1);
	let hours = (ms / (1000 * 60 * 60)).toFixed(1);
	let days = (ms / (1000 * 60 * 60 * 24)).toFixed(1);

	if (seconds < 60) {
		return seconds + " Sec";
	} else if (minutes < 60) {
		return minutes + " Min";
	} else if (hours < 24) {
		return hours + " Hrs";
	} else {
		return days + " Days"
	}
}

function showProgress(currentNumberOfResults, totalNumberOfResults, beginTime)
{
	const timeElapsed = timeConversion(new Date() - beginTime);
	console.log(`Progress ${currentNumberOfResults}/${totalNumberOfResults} (${100.0 * currentNumberOfResults/totalNumberOfResults} %) (${timeElapsed} elapsed)`);
}

function writeJSONFile(data, replacer, path)
{
	filesSystem.writeFileSync(path, JSON.stringify(data, replacer, 4), "utf8");
}

function writeHTMLFile(data, path)
{
	filesSystem.writeFileSync(path, data, "utf8");
}

function createActivityFolder(activityResult)
{
	//Transform name with _ character
	let find = ' ';
	let re = new RegExp(find, 'g');

	const nameDir = `./outputData/${activityResult.name.replace(re, "_")}`;

	if (!filesSystem.existsSync(nameDir))
	{
		filesSystem.mkdirSync(nameDir);
	}

	activityResult["nameDir"] = nameDir;
	activityResult["namePageBeginning"] = activityResult.name.replace(re, "_");

	return activityResult;
}

async function download_html(url, html_path_without_extension)
{
	try
	{
		const dom = await JSDOM.fromURL(url,
			{
				//runScripts: "dangerously",
				resources: "usable",
				pretendToBeVisual: true
			});

		writeHTMLFile(dom.serialize(), `${html_path_without_extension}.html`);

		return Promise.resolve(`success`);
	}
	catch(e)
	{
		console.error(`Error while doing a request to url ${url}: ${e}`);
		return Promise.reject(`Error while doing a request to url ${url}: ${e}`);
	}
}

async function run(pathToWebResults)
{
	let filePath = pathToWebResults;
	let arrayOfActivityResults = JSON.parse(filesSystem.readFileSync(filePath)).filter(act => GENERAL_CONFIG.excludedActivities.includes(act.folderName));
	console.log(arrayOfActivityResults.map(a => a.folderName))

	//Progress variables
	let totalNumberOfResults = arrayOfActivityResults.map(activity => activity.realNumberResults).reduce((tot, curr) => tot + curr, 0);
	let currentNumberOfResults = 0;
	let initTime = new Date();
	showProgress(currentNumberOfResults, totalNumberOfResults, initTime);

	const all = await from(arrayOfActivityResults)//Stream activity results
	.pipe(map(createActivityFolder))//Stream activity results
	.pipe(concatMap(activity =>
		from(activity.results)//Stream results
		.pipe(map((x, index) => [x.url, index]))//Stream urls
		.pipe(take(GENERAL_CONFIG.wantedNumberOfResultsPerActivity))//Stream urls
		.pipe(bufferCount(GENERAL_CONFIG.batchSizeHTMLDownloading))//Stream de arrays de urls
		.pipe(concatMap(someUrlsAndIndex =>
			{
				return from(someUrlsAndIndex)//Stream urls
				.pipe(mergeMap(([url, index]) =>
				{
					return from(download_html(url, `${activity.nameDir}/${activity.namePageBeginning}_${index}`).catch(err => err));
				}))//Stream de string ("success" ou)
				.pipe(tap(() =>
				{
					currentNumberOfResults++;
					showProgress(currentNumberOfResults, totalNumberOfResults, initTime);
				}))
			}
		))//Stream de string ("success" ou)
	))
	.pipe(toArray())
	.toPromise();//Stream d'une seule array de string ("success", ...);


	const [errors, valids] = partition(from(all), res => res !== "success");

	const errorStream = errors
	.pipe(toArray())
	.pipe(map(errors =>
	{
		console.info("Errors: ", errors);
		writeJSONFile(errors, null, "./outputData/errors.json");
	}));

	await Promise.all([errorStream.toPromise(), valids.toPromise()]);
}

(async () =>
{
	await run(GENERAL_CONFIG.pathToWebResults);
})();
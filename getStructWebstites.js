import originalResults from "./data/duckduckgoWebResults.json";
import filesSystem from "fs";

async function run()
{
    let filter = "wikihow.com";
    let filteredResults = originalResults.map(activityRes =>
    {
        activityRes.results = activityRes.results.filter(oneRes => oneRes.url.search(filter) !== -1);
        activityRes.realNumberResults = activityRes.results.length;
        activityRes.filter = filter;
        return activityRes;
    });

    writeJSONFile(filteredResults, null, "./data/filteredDuckduckgoWebResults.json");
}

function writeJSONFile(data, replacer, path)
{
    filesSystem.writeFileSync(path, JSON.stringify(data, replacer, 4), "utf8");
}

(async () =>
{
    await run();
})();
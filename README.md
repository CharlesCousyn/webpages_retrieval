# Web pages retrieval

**Requirements** <br/>
- [Node.js]
- [NPM]

**How to install the project?** <br/>
Just run ```npm install```

**How to run the project?** <br/>
Just run ```npm start```  (by default, running this command delete the content of the ``outputData`` folder)

**Where do i have to put the file from  [search activity project](https://github.com/CharlesCousyn/search_activities)?** <br/>
In the ``data`` folder

**Where can I change my parameters?** <br/>
In the root folder, in the file ```generalConfig.json```
```
{
  "pathToWebResults": "./data/filteredDuckduckgoWebResults_MANUALLY_ENHANCED.json", //path to the file from Search Activity Project
  "wantedNumberOfResultsPerActivity": 1000, //Fix the maximum number per activity
  "batchSizeHTMLDownloading": 10, //Batch size
  "prodMode": false, //Delete annoying message from jsdom errors
  "activitiesToUse": [] //Array of activity name you want to be specifically used
}
```

**Where can I find the web pages?** <br/>
In the folder ``outputData``. More precisely, in the folders named using activity labels
The images are named using the format ``[activityName]_[id].html``


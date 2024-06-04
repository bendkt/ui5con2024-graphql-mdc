const mountainsJSON = require('./mountains.json');
const { randomUUID } = require('crypto');
var fs = require('fs');

const mountains  = mountainsJSON.mountains;
const ranges = mountainsJSON.ranges
const countries = require("./countries.json").value;


const newRanges = ranges.map(r => ({...r, id: randomUUID()}));
const newMountains = mountains.map(m => ({
    ...m,
    id: randomUUID()
}))

const newMountainsWithParentAndRange = newMountains.map(m => {
    const oResult = m;
    const oRange = newRanges.find(r => r.name === m.range)?.id
    oResult.id_range = oRange || "";

    delete oResult.rank;

    oResult.country_codes = m.countries.replaceAll(/\s/gi, "").split(",").map(countryname => {
        return countries.find(c => c.descr === countryname)?.code
    })

    delete oResult.countries;

    const oParentMountain = newMountains.find(nm => nm.name === m.parent_mountain)?.id
    oResult.id_parent = oParentMountain || "";

    delete oResult.parent_mountain;

    return oResult
})

fs.writeFile ("../lib/data.json", JSON.stringify({ranges: newRanges, countries, mountains: newMountains}), function(err) {
    if (err) throw err;
    console.log('complete');
    }
);
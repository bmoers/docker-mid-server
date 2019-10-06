
const Promise = require('bluebird');

const versions = require('./mid-server-versions.json');

const versionsLen = Object.keys(versions).length;

console.log('Total number of cities ', versionsLen)


let first = 0;
Promise.reduce(Object.keys(versions).sort().reverse(), (out, city, cityIndex) => {

    console.log('City:', city, 'Index:', cityIndex);

    const builds = versions[city];

    if (builds.length) {
        first = (first == 0) ? 1 : 2;
    }

    console.log('first', first);

    return Promise.reduce(builds.sort((a, b) => b.id - a.id), (out, build, buildIndex) => {

        if (buildIndex == 0) {
            if (first == 1) {
                out.push('latest')
            }
            out.push(`${city}.latest`);

        } else {
            out.push(`${city}.${build.tagname}`);
            out.push(`${city}.pin.${build.tagname}`);
        }

        return out

    }, []).then((o) => o.join(', ')).then((a) => {
        if (a.length)
            out[city] = a;
        return out;
    })

}, {}).then((li) => {
    console.log(li)
});

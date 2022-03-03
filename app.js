

require('dotenv').config();
const request = require('request-promise');
const Promise = require('bluebird');

const { execAsync } = require('async-child-process');


const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
var db;

const connect = async () => {
    await client.connect();
    return client.db();
}

const getCities = () => {
    return new Promise((resolve, reject) => {
        db.collection("city").find({ active: true }).toArray((err, result) => {
            if (err)
                return reject(err);
            resolve(result.map((city) => city.name));
        });
    });
}

const getBuilds = (cities) => {
    return new Promise((resolve, reject) => {
        db.collection("build").find({ city: { $in: cities } }).toArray((err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}
const addBuild = (build) => {
    return new Promise((resolve, reject) => {
        db.collection("build").insertOne(build, (err, res) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            resolve(res.ops);
        });
    });
}

const updateBuild = (build) => {
    if (!build._id)
        return addBuild(build);

    return new Promise((resolve, reject) => {
        db.collection("build").updateOne({ _id: build._id }, { $set: build }, { upsert: true }, (err, res) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            resolve(res.ops);
        });
    });
}

const dockerBuild = async (command, tags, city, build) => {

    console.log(`Building image: ${city}, version: ${build.version}, tags: ${tags}`);
    await execAsync(`docker login -u ${process.env.DOCKER_USER_NAME} -p ${process.env.DOCKER_TOKEN}`, { cwd: './docker' })

    // build image with all tags
    console.log(`build image: ${tags}`)
    const { stdout: buildStdout } = await execAsync(command, { cwd: './docker' });
    console.log(`\t${buildStdout.split('\n').slice(-2)[0]}`);
    console.log("\tbuild done");

    // push image with all tags in sequence
    await Promise.each(tags, (async (tag) => {
        console.log(`push tag: ${tag}`)
        const { stdout: pushStdout } = await execAsync(`docker push ${tag}`, { cwd: './docker' });
        console.log(`\t${pushStdout.split('\n').slice(-2)[0]}`);
        console.log("\ttag done");
    }))

    // cleanup as my disk is not endless
    await Promise.all(tags.map(async (tag) => {
        console.log(`remove local tag:  ${tag}`);
        const { stdout: rmiStdout } = await execAsync(`docker rmi --force ${tag}`, { cwd: './docker' });
        console.log(`\t${rmiStdout.split('\n').slice(-2)[0]}`);
    }));

}


const getNewBuilds = async (city, existingBuilds = []) => {
    console.log(`process city ${city}`);

    // get the city patchURLs from the release notes
    const patchUrls = [];
    try {

        const html = await request(`https://docs.servicenow.com/bundle/${city}-release-notes/toc/release-notes/available-versions.html`);
        const regex = /(https:\/\/docs\.servicenow\.com\/bundle\/[^\/]+-release-notes\/page\/release-notes\/quality\/[^\/\s]+\.html)/g
        let m;

        while ((m = regex.exec(html)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            patchUrls.push(m[1])
        }
    } catch (e) {
        console.error(`city ${city} http request failed! (https://docs.servicenow.com/bundle/${city}-release-notes/toc/release-notes/available-versions.html)`, e.message);
    }

    // get all mid builds from the patchUrl page
    let builds = await Promise.mapSeries(patchUrls, async (url) => {

        console.log('parsing mid version info from', url);

        const out = {
            tag: undefined,
            date: undefined
        };

        try {
            let html = await request(url);
            html = html.replace(/<span[^>]*>/g, '').replace(/<\/span>/g, '');

            let regex = />Build tag:\s+(?:glide-)?([^<]+)</i
            let m = html.match(regex);

            if (m) {
                out.tag = m[1];
            } else {
                console.warn('Tag not found')
            }
            regex = />Build date:\s+([^<]+)</i
            m = html.match(regex);
            if (m) {
                out.date = m[1];
            } else {
                console.warn('Date not found')
            }

            if (!out.tag || !out.date) {
                console.warn(`Parsing failed! ${url}`);
                console.log(out)
            }

        } catch (e) {
            console.error('Request failed: ', url);
        }
        return out;
    });

    // only keep the ones which are correct
    builds = builds.filter((build) => build.tag && build.date && build.date.split(/[_-]/).length == 4);

    // construct build object
    builds = builds.map((build) => {
        const dateArray = build.date.split(/[_-]/);
        build.id = `${dateArray[2]}${dateArray[0]}${dateArray[1]}${dateArray[3]}`

        build.city = city;
        build.version = `${build.tag}_${build.date}`;
        build.url = `https://install.service-now.com/glide/distribution/builds/package/mid/${dateArray[2]}/${dateArray[0]}/${dateArray[1]}/mid.${build.version}.linux.x86-64.zip`
        build.tagname = build.tag.split('__')[1];
        build.done = false;
        return build;
    });

    const existingBuildIds = existingBuilds.map((eb) => eb.id);
    // find the builds which are not in the db yet
    let newBuilds = builds.filter((build) => !existingBuildIds.includes(build.id));

    console.log(`newBuilds : ${newBuilds.length}`)

    //and check if zip file exists
    newBuilds = await Promise.mapSeries(newBuilds, async (build) => {
        console.log('check for zip file ', build.url)
        try {
            await request({ method: 'HEAD', url: build.url });
            build.zipExits = true;
        } catch (e) {
            build.zipExits = false;
            console.warn("zip file not found on server for build", build.url);
        }
        return build;
    }).filter((build) => build.zipExits);

    return existingBuilds.concat(newBuilds).filter((build) => build.zipExits);;
}


(async () => {
    try {
        db = await connect();
        const cities = (await getCities()).sort();
        let existingBuilds = await getBuilds(cities);

        if (process.env.FORCE_REFRESH == 'true') {
            // force reset build done
            console.warn('FORCE REFRESH MODE: replacing all images !')
            existingBuilds = existingBuilds.map((build) => {
                build.done = false;
                return build;
            });
        }

        const versions = existingBuilds.reduce((out, build) => {
            if (out[build.city]) {
                out[build.city].push(build);
            } else {
                out[build.city] = [build];
            }
            return out;
        }, {});

        //console.log("%j", cities)

        const cityBuilds = await Promise.mapSeries(cities, async (city) => {
            const builds = await getNewBuilds(city, versions[city]);
            return {
                city,
                builds
            }
        });


        //console.log("%j", cityBuilds)


        const buildVersions = {};
        cityBuilds.forEach((obj) => {
            buildVersions[obj.city] = obj.builds
        });

        const citiesSorted = Object.keys(buildVersions).sort();
        const versionsLen = citiesSorted.length;
        console.log('Total number of cities ', versionsLen)
        console.log('Cities ', citiesSorted.join(', '));

        await Promise.each(citiesSorted, async (city, cityIndex) => {

            console.log(`City: '${city}' index: ${cityIndex}`);

            const builds = buildVersions[city];
            const buildsSorted = builds.sort((a, b) => a.id - b.id);

            await Promise.each(buildsSorted, async (build, buildIndex) => {
                try {

                    if (!build.zipExits) {
                        console.log("zip does not exist, skip ", build.url);
                        return;
                    }

                    if (build.done) {
                        console.log("this build is done, skip %j", build.tag)
                        return;
                    }

                    const tags = [`moers/mid-server:${city}.${build.date}`]; // `moers/mid-server:${city}.${build.tagname}`, 

                    if (buildIndex == 0) {
                        tags.push(`moers/mid-server:${city}`);
                        tags.push(`moers/mid-server:${city}.first`);
                    }

                    if (buildIndex == builds.length - 1) {
                        tags.push(`moers/mid-server:${city}.latest`);
                        if (cityIndex == versionsLen - 1)
                            tags.push('moers/mid-server:latest')
                    }
                    //console.log(tags);
                    await dockerBuild(`docker build -f ./Dockerfile --no-cache --build-arg URL=${build.url} ${tags.map((t) => `--tag ${t}`).join(' ')} . `, tags, city, build);
                    build.done = true;
                    await updateBuild(build);

                } catch (e) {
                    console.error('somethings wrong', e)
                }

            });
        });

    } finally {
        client.close();
    }
})();


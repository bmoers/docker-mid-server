

const request = require('request-promise');
const Promise = require('bluebird');
const fs = require('fs-extra');

const { execAsync } = require('async-child-process');


const cities = ['paris', 'orlando', 'newyork', 'madrid', 'london'];//, 'madrid', 'london']//;, 'madrid', 'london', 'jakarta'];

const versions = require('./mid-server-versions.json')

const dockerBuild = (command, tags, city, build) => {
    console.log(`Building image: ${city}, version: ${build.version}, tags: ${tags}`);
    return execAsync(command, { cwd: './docker' }).then(({ stdout, stderr }) => {
        //console.log(stdout, stderr)
        console.log("\tbuild done");

        return Promise.each(tags, ((tag) => {
            command = `docker push ${tag}`;
            console.log(`push tag ${tag}`)
            return execAsync(command, { cwd: './docker' }).then(({ stdout, stderr }) => {
                console.log(`\t${stdout.split('\n').slice(-2)[0]}`);
                console.log("\ttag done");
            });
        }));
    }).then(() => {
        return Promise.each(tags, ((tag) => {
            console.log('remove local image ', tag);
            return execAsync(`docker rmi ${tag}`, { cwd: './docker' })
        }));
    });
}
Promise.mapSeries(cities, (city) => {
    return request(`https://docs.servicenow.com/bundle/${city}-release-notes/toc/release-notes/available-versions.html`).then((html) => {
        const regex = new RegExp(`(https:\/\/docs\.servicenow\.com\/bundle\/${city}-release-notes\/page\/release-notes\/[^\/]+\/[^-]+-patch[^\.]+\.html)`, 'gm');
        let m;
        const patchUrls = [];
        while ((m = regex.exec(html)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            patchUrls.push(m[1])
        }
        return patchUrls;
    }).catch(() => {
        return [];
    }).then((patchUrls) => {
        return Promise.mapSeries(patchUrls, (url) => {
            console.log('getting mid version info from ', url);
            return request(url).then((html) => {
                let regex = />Build tag:\s+(?:glide-)?([^<]+)</i
                let m = html.match(regex);
                const out = {
                    tag: undefined,
                    date: undefined
                };
                if (m) {
                    out.tag = m[1];
                }
                regex = />Build date:\s+([^<]+)</i
                m = html.match(regex);
                if (m) {
                    out.date = m[1];
                }
                return out;
            })
        })
    }).then((builds) => {
        return builds.map((build) => {
            if (build.date) {
                const dateArray = build.date.split(/[_-]/);
                if (dateArray.length == 4) {
                    build.version = `${build.tag}_${build.date}`;
                    build.url = `https://install.service-now.com/glide/distribution/builds/package/mid/${dateArray[2]}/${dateArray[0]}/${dateArray[1]}/mid.${build.version}.linux.x86-64.zip`
                    build.id = `${dateArray[2]}${dateArray[0]}${dateArray[1]}${dateArray[3]}`
                    build.tagname = build.tag.split('__')[1]
                } else {
                    console.warn("patch does not match", build)
                }
            }
            return build;
        });
    }).then((builds) => {

        const existingBuilds = versions[city];
        if (existingBuilds) {
            builds = builds.filter((b) => {
                return !existingBuilds.some((ex) => ex.tag == b.tag)
            });
        }

        console.log('New Builds for', city, builds);

        return Promise.map(builds, (build) => {
            console.log('check if zip file exists', build.url)
            return request({ method: 'HEAD', url: build.url }).then(() => true).catch(() => false).then((found) => {
                build.zipExits = found;
                if (!found)
                    console.log("zip file not found on server for build", build)
                return build
            });
        }).then((builds) => {
            return {
                city,
                builds: builds
            };
        })

    });
}).then((newBuilds) => {
    // convert to city map
    return newBuilds.reduce((out, row) => {
        // remove the ones without an id
        out[row.city] = row.builds.filter((p) => p.id);
        return out;
    }, {});
}).then((newBuilds) => {

    // merge new builds with existing ones
    Object.keys(newBuilds).forEach((nCity) => {
        if (!versions[nCity]) {
            versions[nCity] = newBuilds[nCity]
        } else {
            versions[nCity] = newBuilds[nCity].concat(versions[nCity])
        }
    })
    return fs.writeJson('./mid-server-versions.json', versions, { spaces: "\t" }).then(() => versions);

}).then((versions) => {

    const versionsLen = Object.keys(versions).length;

    console.log('Total number of cities ', versionsLen)

    return Promise.each(Object.keys(versions).sort(), (city, cityIndex) => {

        console.log('City:', city, 'Index:', cityIndex);

        const builds = versions[city];

        return Promise.each(builds.sort((a, b) => a.id - b.id), (build, buildIndex) => {

            return Promise.try(() => {

                if (!build.zipExits) {
                    console.log("zip does not exist, skip ", build.url);
                    return;
                }

                if (build.done)
                    return;

                if (buildIndex == builds.length - 1) {
                    const tags = [`moers/mid-server:${city}.latest`];
                    if (cityIndex == versionsLen - 1)
                        tags.push('moers/mid-server:latest')

                    return dockerBuild(`docker build -f ./Dockerfile --build-arg URL=${build.url} ${tags.map((t) => `--tag ${t}`).join(' ')} .`, tags, city, build);

                } else {

                    return Promise.try(() => {
                        const tags = [`moers/mid-server:${city}.${build.tagname}`];
                        return dockerBuild(`docker build -f ./Dockerfile --build-arg URL=${build.url} ${tags.map((t) => `--tag ${t}`).join(' ')} .`, tags, city, build);
                    }).then(() => {
                        const tags = [`moers/mid-server:${city}.pin.${build.tagname}`];
                        return dockerBuild(`docker build -f ./Dockerfile --build-arg URL=${build.url} --build-arg VERSION=${build.tag} ${tags.map((t) => `--tag ${t}`).join(' ')} .`, tags, city, build);
                    });
                }
            }).then(() => {
                build.done = true;
                return fs.writeJson('./mid-server-versions.json', versions, { spaces: "\t" });
            }).catch((e) => {
                console.error('somethings wrong', e)
            })

        });



    }).then(() => {
        console.dir(versions, { depth: null, colors: true });
        return fs.writeJson('./mid-server-versions.json', versions, { spaces: "\t" });
    });





}).catch((e) => {
    console.error(e);
});


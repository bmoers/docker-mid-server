

const request = require('request-promise');
const Promise = require('bluebird');
const fs = require('fs-extra');

const { exec, spawn } = require('child-process-async');

const cities = ['newyork', 'madrid', 'london']//;, 'madrid', 'london', 'jakarta'];

const versions = require('./mid-server-versions.json')

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

        console.log('newBuilds 1', builds);

        return Promise.filter(builds, (build) => {
            console.log('check if zip file exists', build.url)
            return request({ method: 'HEAD', url: build.url }).then(() => true).catch((e) => false);
        }).then((builds) => {
            return {
                city,
                builds: builds
            };
        })

    });
}).then((m) => {
    return m.reduce((out, row) => {
        out[row.city] = row.builds.filter((p) => p.id);
        return out;
    }, {});
}).then((newBuilds) => {
    /*
    - docker login -u gitlab-ci-token -p $CI_JOB_TOKEN registry.gitlab.com
    
    */

    console.log('newBuilds 2', newBuilds);

    Object.keys(newBuilds).forEach((nCity) => {

        if (!versions[nCity]) {
            versions[nCity] = newBuilds[nCity]
        } else {
            versions[nCity] = newBuilds[nCity].concat(versions[nCity])
        }
    })

    const vl = Object.keys(versions).length;
    return Promise.map(Object.keys(versions).reverse(), (city, vi) => {
        const builds = versions[city];


        return Promise.map(builds.sort((a, b) => a.id - b.id), (build, bi) => {
            console.log(`${city}/${build.tagname}`, vi, vl - 1)
            //const dir = `${city}/${build.tagname}`;

            const tags = [`moers/mid-server:${city}.${build.tagname}`, `moers/mid-server:${build.tagname}`];
            if (vi == vl - 1 && bi == builds.length - 1)
                tags.push('moers/mid-server:latest')
            if (bi == builds.length - 1)
                tags.push(`moers/mid-server:${city}`)

            console.log(tags);
            /*
            exe(`docker build -f ${dir}/Dockerfile ${tags.map((t) => ` --tag ${t}`)} ${dir}/.`)

            exec('docker build -f ./Dockerfile --tag ')

            tags.forEach((t => {
                exe(`docker push ${t}`)
            }))
*/



            /*
 
            --tag  --tag 
            
 
                - docker build -f ./app/dockerfile --tag registry.gitlab.com/bmoers/erm4sn-v3:$CI_COMMIT_SHA --tag registry.gitlab.com/bmoers/erm4sn-v3:latest .
                - docker push registry.gitlab.com/bmoers/erm4sn-v3:$CI_COMMIT_SHA
                - docker push registry.gitlab.com/bmoers/erm4sn-v3:latest
            */
            ;
        })
    }).then(() => {


        //console.dir(newBuilds, { depth: null, colors: true });
        return fs.writeJson('./mid-server-versions.json', versions, { spaces: "\t" });
    });





});




const request = require('request-promise');
const Promise = require('bluebird');
const fs = require('fs-extra');

const cities = ['newyork', 'madrid', 'london']//;, 'madrid', 'london', 'jakarta'];

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
                } else {
                    console.warn("patch does not match", build)
                }
            }
            return build;
        });
    }).then((builds) => {
        //console.log(patches);
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
}).then((m) => {
    /*
    - docker login -u gitlab-ci-token -p $CI_JOB_TOKEN registry.gitlab.com
    
    */
    console.dir(m, { depth: null, colors: true });
    return fs.writeJson('./mid-server-versions.json', m, { spaces: "\t" });


    return Promise.map(Object.keys(m), (version, vi) => {
        const builds = m[version];
        return Promise.map(builds, (build, bi) => {
            console.log(`${version}/${build.id}`)
            const dir = `${version}/${build.id}`;
            return fs.ensureDir(dir).then(() => {
                /*
                const file = ``;

                const tags = [`mid-server:${version}-${build.date}`, `mid-server:${build.date}`];
                if (vi == 0 && bi == 0)
                    tags.push('mid-server:latest')
                if (bi == 0)
                    tags.push(`mid-server:${version}`)

                exe`docker build -f ${dir}/dockerfile ${tags.map((t) => ` --tag ${t}`)} ${dir}/.`
                tags.forEach((t => {
                    `docker push ${t}`
                }));
                */
            })


                /*
    
                --tag  --tag 
                
    
                    - docker build -f ./app/dockerfile --tag registry.gitlab.com/bmoers/erm4sn-v3:$CI_COMMIT_SHA --tag registry.gitlab.com/bmoers/erm4sn-v3:latest .
                    - docker push registry.gitlab.com/bmoers/erm4sn-v3:$CI_COMMIT_SHA
                    - docker push registry.gitlab.com/bmoers/erm4sn-v3:latest
                */
                ;
        })
    });
});


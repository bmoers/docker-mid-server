
const request = require('request-promise');
const Promise = require('bluebird');
const { v4: uuid } = require('uuid');
const { execAsync } = require('async-child-process');

const { HOST, SN_HOST_NAME, USER_NAME, PASSWORD, PROXY, PROXY_PORT } = (process.env.HOST || process.env.SN_HOST_NAME) ? process.env : require('minimist')(process.argv.slice(2));

const FQDN = (SN_HOST_NAME) ? SN_HOST_NAME : `${HOST}.service-now.com`;

const start = () => {
    return Promise.try(() => {
        if (!HOST && !SN_HOST_NAME)
            throw Error('HOST or SN_HOST_NAME is mandatory');
        if (!USER_NAME)
            throw Error('USER_NAME is mandatory');
        if (!PASSWORD)
            throw Error('PASSWORD is mandatory');

    }).then(() => {

        return request(`https://${FQDN}/stats.do`, {
            auth: {
                user: USER_NAME,
                password: PASSWORD
            }
        }).then((xml) => {
            let regex = /Build name:\s+(\w*)/im
            let m = xml.match(regex);
            const out = {
                city: undefined,
                date: undefined
            };
            if (m) {
                out.city = m[1].toLowerCase();
            }
            regex = /Build date:\s+([0-9_-]*)/im
            m = xml.match(regex);
            if (m) {
                out.date = m[1];
            }
            return out;
        })
    }).then((build) => {

        if (!build || !build.city)
            throw Error('No build information found ' + JSON.stringify(build))

        const tag = `${build.city}.${build.date}`

        console.log(`Checking for image for ${tag}`);

        console.log(`https://hub.docker.com/v2/repositories/moers/mid-server/tags/${tag}`)
        return request({ method: 'HEAD', url: `https://hub.docker.com/v2/repositories/moers/mid-server/tags/${tag}` }).then(() => true).catch(() => false).then((found) => {
            if (found)
                return tag;

            console.log(`No image found for tag '${tag}'. Checking for image for ${build.city}`);
            return request({ method: 'HEAD', url: `https://hub.docker.com/v2/repositories/moers/mid-server/tags/${build.city}` }).then(() => true).catch(() => false).then((found) => {
                if (found)
                    return build.city;

                console.log(`No image found for ${build.city}`);
                return null
            });

        });

    }).then((tag) => {
        if (!tag)
            throw Error('No docker image found', tag)

        const name = `mid-${tag}-${uuid().split('-')[0]}`;

        console.log(`Starting docker container '${name}' for environment '${FQDN}'`);
        
        const command = `docker run -d --name ${name}  --env SN_HOST_NAME=${FQDN} --env USER_NAME=${USER_NAME} --env PASSWORD=${PASSWORD} ${(PROXY) ? `--env PROXY=${PROXY}` : ''} ${(PROXY_PORT) ? `--env PROXY_PORT=${PROXY_PORT}` : ''} moers/mid-server:${tag}`;
        return execAsync(command, { cwd: './' }).then(({ stdout, stderr }) => {
            console.log(stdout);
        })
    }).catch((e) => {
        console.error(e);
    })

}
start();

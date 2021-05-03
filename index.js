const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const guid = (len) => {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    if (len == 8) {
        return s4() + s4();
    }
    if (len == 4) {
        return s4();
    }
    return s4() + s4() + s4() + s4() + s4() + s4() + (new Date).getTime().toString(16);
}
const _defaultHeaders = ['Authorization', 'Content-Type', 'x-api-key', 'authtype', 'username', 'name'];
var configs = {
    port: 3434,
    projectPath: null
};
const logger = (isError, ...args) => {
    if (isError) {
        console.error('[ERROR]: ', ...args);
    } else {
        console.log('[LOG]: ', ...args);
    }
};
const sendResponse = ({ req, res, data, allowedHeaders }) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Headers', configs.allowedHeaders.join(','));
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PATCH,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });
    if (data) {
        res.end(data && typeof data === 'object' ? JSON.stringify(data) : data);
    } else {
        res.end();
    }
};
const checkAndCreateFolder = (pathToCheck, folderName) => {
    if (!fs.existsSync(pathToCheck)) {
        fs.mkdirSync(path.join(pathToCheck, folderName));
    }
}
const handleTableAction = async ({ req, res, queryParams }) => {
    let responseData = {
        data: []
    };
    let isRequestHandled = false;
    let filePath = path.join(configs.projectPath, 'data', queryParams.tablename + '.json');
    let isFileExists = fs.existsSync(filePath);
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                let jsonBody = JSON.parse(body);
                jsonBody['id'] = guid();
                let fileContent = {
                    data: [jsonBody]
                };
                let records = [jsonBody];
                if (isFileExists) {
                    let recordsContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
                    let recordsJson = JSON.parse(recordsContent);
                    if (recordsJson && recordsJson.data) {
                        recordsJson.data.push(jsonBody);
                    }
                    records = recordsJson.data;
                    fileContent = recordsJson;
                }
                fs.writeFileSync(filePath, JSON.stringify(fileContent));
                res.ok({
                    data: records
                });
            } catch (e) {
                res.ok({
                    error: {
                        code: 'INVALID_FORMAT'
                    }
                });
            }
        });
        isRequestHandled = true;
    }

    if (req.method === 'GET') {
        if (isFileExists) {
            try {
                let recordsContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
                let recordsJson = JSON.parse(recordsContent);
                if (recordsJson && recordsJson.data) {
                    responseData.data = recordsJson.data;
                }
            } catch(e) {
                // swallow
            }
        }
    }

    if (req.method === 'PATCH' && queryParams.id) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                let jsonBody = JSON.parse(body);
                if (isFileExists) {
                    let recordsContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
                    let recordsJson = JSON.parse(recordsContent);
                    if (recordsJson && recordsJson.data && recordsJson.data instanceof Array) {
                        let lengthOfRecords = recordsJson.data.length;
                        for (let i = 0; i < lengthOfRecords; i++) {
                            let item = recordsJson.data[i];
                            if (item['id'] === queryParams.id) {
                                Object.keys(jsonBody).forEach(keyToUpdate => {
                                    item[keyToUpdate] = jsonBody[keyToUpdate];
                                });
                                break;
                            }
                        }
                        responseData.records = recordsJson.data;
                    }
                    fs.writeFileSync(filePath, JSON.stringify(recordsJson));
                }
                res.ok(responseData);
            } catch (e) {
                res.ok({
                    error: {
                        code: 'INVALID_FORMAT'
                    }
                });
            }
        });
        isRequestHandled = true;
    }

    if (req.method === 'DELETE' && queryParams.id) {
        try {
            if (isFileExists) {
                let recordsContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
                let recordsJson = JSON.parse(recordsContent);
                let foundTheRecord = false;
                if (recordsJson && recordsJson.data && recordsJson.data instanceof Array) {
                    let lengthOfRecords = recordsJson.data.length;
                    let remainingRecords = [];
                    for (let i = 0; i < lengthOfRecords; i++) {
                        let item = recordsJson.data[i];
                        if (!(item['id'] === queryParams.id)) {
                            remainingRecords.push(item)
                        } else {
                            foundTheRecord = true;
                        }
                    }
                    responseData.data = remainingRecords;
                    recordsJson.data = remainingRecords;
                }
                if (foundTheRecord) {
                    fs.writeFileSync(filePath, JSON.stringify(recordsJson));
                }
            }
        } catch (e) {
            // swallow
        }
    }

    if (!isRequestHandled) {
        res.ok(responseData);
    }
};
const requestHandler = (req, res) => {
    res.ok = (data = {}) => {
        sendResponse({
            req, 
            res,
            data
        });
    };
    if (req.method === 'OPTIONS') {
        res.ok();
    } else {
        let queryPath = url.parse(req.url);
        let queryParams = querystring.parse(queryPath.query);
        if (queryParams.tablename) {
            handleTableAction({ req, res, queryParams });
        } else {
            res.ok({
                error: {
                    code: 'NOT_ALLOWED',
                    message: 'Method is not allowed'
                }
            });
        }
    }
}
module.exports = {
    start: async ({ port = 3434, projectPath, requestHeaders, sslFilesPath  }) => {
        let newConfigs = {
            port,
            projectPath
        }
        logger(null, `Port: ${port}`);
        logger(null, `Root Path: ${projectPath}`);
        let objectToReturn = {
            httpServer: null
        };
        let isValidToStart = true;
        if (!projectPath) {
            isValidToStart = false;
        }
        if (isValidToStart) {
            configs = Object.assign(configs, newConfigs);
            var allowedHeaders = _defaultHeaders;
            if (requestHeaders && requestHeaders instanceof Array) {
                allowedHeaders = [].concat(allowedHeaders, requestHeaders);
            }
            configs.allowedHeaders = allowedHeaders;
            checkAndCreateFolder(configs.projectPath, 'data');
            objectToReturn.httpServer = require('http').createServer(requestHandler).listen(port, () => {
                logger(null, `Server Listening on ${port}`);
            });
        } else {
            logger(true, `Required configurations are missing`);
        }
        // let certOptions = {
        //     key: fs.readFileSync('ssl/server.key'),
        //     cert: fs.readFileSync('ssl/server.crt')
        // };
        // return require('https').createServer(certOptions, requestHandler).listen(sslPort, () => {
        //     console.log('Secure Server Listining on ' + sslPort);
        // });
        return objectToReturn;
    }
};
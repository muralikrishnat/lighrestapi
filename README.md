# lighrestapi

lighrestapi is simple and light weight REST API, uses json files to store the information.

## Who needs lighrestapi

You are in need of simple API endpoints to support your web application without spending lot of time on API development.

<b>lightrestpi</b> provides APIs with zero configurations and free flow strategy, means no restrictions on table columns and data types, its simple json format stored in json files.

## Installation

Install via npm

```
npm i lighrestapi
```


## Usage

```
// index.js
const api = require('lighrestapi');

api.start({
    port: 1337, // port to start api
    projectPath: __dirname, // project root folder
    requestHeaders: ['x-api-key'] // configure allowed headers
});

```

To start the API server run below command in terminal/command prompt

```
node index.js
```

Thats it you should see below message in terminal 

```
Server Listening on 1337
```

Now, you are good to utilize the API endpoints in REST CRUD format. Lets see the available endpoints quickly

Here you can create many tables as you want just use *tablename* query param to specify the table name.


### Create record

Endpoint: http://localhost:1337/api/query?tablename=countries

example code using axios from Frontend to create the record in JSON
```
var data = JSON.stringify({"name":"India","code":"INR"});

var config = {
  method: 'post',
  url: 'http://localhost:1337/api/query?tablename=countries',
  headers: { 
    'Content-Type': 'application/json'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
```

### Read

Endpoint: http://localhost:1337/api/query?tablename=countries

example code using axios to fetch the list of records
```
var config = {
  method: 'get',
  url: 'http://localhost:1337/api/query?tablename=countries',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
```

### Update

Endpoint: http://localhost:1337/api/query?tablename=countries&id=eda612d3d48a83629580f5d8179315e53f8

example code using axios to update the specific record with respective to id attribute

```
var data = JSON.stringify({"age":"30"});

var config = {
  method: 'patch',
  url: 'http://localhost:1337/api/query?tablename=countries&id=eda612d3d48a83629580f5d8179315e53f8',
  headers: { 
    'Content-Type': 'application/json'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
```
### Delete

Endpoint: http://localhost:1337/api/query?tablename=countries&id=eda612d3d48a83629580f5d8179315e53f8

example code using axios to delete the record from the list

```
var config = {
  method: 'delete',
  url: 'http://localhost:1337/api/query?tablename=countries&id=eda612d3d48a83629580f5d8179315e53f8',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
```

## Usefull information

If you check the response of each endpoint is consistant and we are returning list of records available in the specified table.

```
{
    "data": [
        {
            "name": "India",
            "code": "INT",
            "id": "66de8f55cb55abff1e526fb117931727338"
        },
        {
            "name": "Canada",
            "code": "CAD",
            "id": "5ff92d8e7e5878eea1a059c51793172ce2d"
        }
    ]
}
```

Postman Collection: https://documenter.getpostman.com/view/3476064/TzRNDUqQ


## Whats next

- Ability to use MongoDB
- Encryption on sensitive information/fields
- Keeping it simple

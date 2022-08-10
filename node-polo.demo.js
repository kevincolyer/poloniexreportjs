'use strict'

const SAVEDATA = false;
const LOADDATA = true;

// Bring in the ability to create the 'require' method
import {
    createRequire
} from "module";

// construct the require method
const require = createRequire(import.meta.url);

const jsonfile = require('jsonfile')
const url = 'https://api.poloniex.com'
const axios = require('axios')
const CryptoJS = require('crypto-js')
const Table = require('cli-table');
const limit = 20;

const {
    apiKey,
    secretKey
} = require('./auth.json'); // use the require method

// nasty global variable
let timestamp = new Date().getTime()

const paramUtils = {
    values: [],
    put(k, v) {
        let value = encodeURIComponent(v)
        this.values.push(k + "=" + value)
    },
    sortedValues() {
        return this.values.sort()
    },
    addGetParams(params) {
        Object.keys(params).forEach(k => {
            this.put(k, params[k])
        })
        this.sortedValues()
    },
    getParams(requestMethod, param) {
        this.values = [];
        if (requestMethod === 'GET') {
            this.put("signTimestamp", timestamp)
            this.addGetParams(param)
            return this.values.join("&").toString()
        } else if (requestMethod === 'POST' || requestMethod === 'PUT' || requestMethod === 'DELETE') {
            return "requestBody=" + JSON.stringify(param) + "&signTimestamp=" + timestamp
        }
    }
}

class Sign {
    constructor(method, path, param, secretKey) {
        this.method = method
        this.path = path
        this.param = param
        this.secretKey = secretKey
    }

    sign() {
        let paramValue = paramUtils.getParams(this.method, this.param)
        let payload = this.method.toUpperCase() + "\n" + this.path + "\n" + paramValue
        //console.log("payload:" + payload)

        let hmacData = CryptoJS.HmacSHA256(payload, this.secretKey);
        return CryptoJS.enc.Base64.stringify(hmacData);
    }
}



function getHeader(method, path, param) {
    const sign = new Sign(method, path, param, secretKey).sign()

    return {
        "Content-Type": "application/json",
        "signatureMethod": "hmacSHA256",
        "signatureVersion": 1,
        "key": apiKey,
        "signature": sign,
        "signTimestamp": timestamp
    }
}

function get(url, path, param = {}) {
    timestamp = new Date().getTime()
    const headers = getHeader('GET', path, param)
    console.log(headers);
    // return promise
    return axios.get(url + path, {
            params: param,
            headers: headers
        })
        .then((response) => {
            // Success
            return {
                response
            }
        })
        .catch((error) => {
            // Error
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log("ERROR RESPONSE >2XX")
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                console.log("ERROR request made; no response recieved")
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the
                // browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('ERROR something else', error.message);
            }
            return {}
        });
}

function post(url, path, param = {}) {
    timestamp = new Date().getTime()
    const headers = getHeader('POST', path, param)

    console.log(headers);
    // return promise
    return axios.post(url + path, {
            params: param,
            headers: headers
        })
        .then((response) => {
            // Success
            return {
                response
            }
        })
        .catch((error) => {
            // Error
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log("ERROR RESPONSE >2XX")
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                console.log("ERROR request made; no response recieved")
                // The request was made but no response was received
                // `error.request` is an instance of XMLHttpRequest in the
                // browser and an instance of
                // http.ClientRequest in node.js
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('ERROR something else', error.message);
            }
            return {}
        });
}

/*
function del(url, path, param = {}, apiKey, secretKey) {
    const sign = new Sign('DELETE', path, param, apiKey, secretKey).sign()
    const headers = sign.sign()
    return axios.delete(url + path, {data: param, headers: {headers}})
        .then(res => console.log(res.data))
        .catch(e => console.error(e))
}

function put(url, path, param = {}, apiKey, secretKey) {
    const sign = new Sign('PUT', path, param, apiKey, secretKey).sign()
    const headers = sign.sign()
    return axios.put(url + path, param, {headers: headers})
        .then(res => console.log(res.data))
        .catch(e => console.error(e))
}*/

/////////////////////////////////////////////
// helper function for number formatting
function percent(number) {

    return (truncate(number * 10000) / 100).toFixed(2)
}

// helper function for number formatting
function truncate(number) {
    return number > 0 ?
        Math.floor(number) :
        Math.ceil(number);
}

function moneydollar(number) {
    return (+number).toFixed(2);
}

function moneybitcoin(number) {
    return (+number).toFixed(8);
}
/////////////////////////////////////////////
// fetch private data
// from poloniex account

/////////////////////////////////////////////
// Get balances

let data;
let r;

if (!LOADDATA) {
    r = await get(url, '/accounts/balances', {});
    if (r === null) {
        exit();
    };
    data = r.response.data[0].balances;
}

const myBalances = LOADDATA ? require('./test-myBalances.json') : data;

// console.log(myBalances)


/////////////////////////////////////////////
// Get open orders
if (!LOADDATA) {
    r = await get(url, '/orders', {
        limit: limit
    })
    if (r === null) {
        exit()
    };
    data = r.response.data;
}
const myOrders = LOADDATA ? require('./test-myOrders.json') : data;
// console.log(myOrders) // Get open orders


/*

// Get open smart orders
timestamp = new Date().getTime()
r =await get(url, '/smartorders', {limit:limit,side:"SELL",from:0})
if (r===null) { throw new Error();};
const mySmartOrders = r.response.data;
console.log(mySmartOrders)// Get open orders


// get historical ordgers
timestamp = new Date().getTime()
r =await get(url, '/orders/history', {limit:limit})
if (r===null) { throw new Error();};
const myHistoricalOrders = r.response.data;
console.log(myHistoricalOrders)


// get SMART historical ordgers
timestamp = new Date().getTime()
r =await get(url, '/smartorders/history', {limit:limit})
if (r===null) { throw new Error();};
const mySmartHistoricalOrders = r.response.data;
console.log(mySmartHistoricalOrders)
*/

// // get curencies
// timestamp = new Date().getTime()
// r =await get(url, '/currencies', {})
// if (r===null) { throw new Error();};
// const myCurrencies = r.response.data;
// console.log(myCurrencies[0])

/////////////////////////////////////////////
// get specific market symbol
// /markets/{symbol}/price
if (!LOADDATA) {
    r = await get(url, '/markets/BTC_USDT/price', {})
    if (r === null) {
        throw new Error();
    };
    data = r.response.data;
}
const myBTC_USDT = LOADDATA ? require('./test-myBTC_USDT.json') : data;

//console.log(myBTC_USDT)

/////////////////////////////////////////////
// get all markets
// /markets/price
if (!LOADDATA) {
    r = await get(url, '/markets/price', {})
    if (r === null) {
        throw new Error();
    };
    data = r.response.data;
}
const marketsPrice = LOADDATA ? require('./test-marketsPrice.json') : data;

// sort markets by greatest daily change (desc)
marketsPrice.sort((a, b) => b.dailyChange - a.dailyChange)

//console.log(marketsPrice[0])


if (SAVEDATA) {
    jsonfile.writeFile('./test-myBalances.json', myBalances, function(err) {
        if (err) console.error(err)
    });
    jsonfile.writeFile('./test-myOrders.json', myOrders, function(err) {
        if (err) console.error(err)
    })
    jsonfile.writeFile('./test-marketsPrice.json', marketsPrice, function(err) {
        if (err) console.error(err)
    })
    jsonfile.writeFile('./test-myBTC_USDT.json', myBTC_USDT, function(err) {
        if (err) console.error(err)
    })

}

/////////////////////////////////////////////////
// tableOfMarkets
// an example
//
// instantiate
var tableOfMarkets = new Table({
    head: ['Market', 'Price', 'Daily Change %'],
    colWidths: [20, 20, 20],
    colAligns: ['left', 'right', 'right']
});

var i = 0;
for (let market of marketsPrice) {
    // table is an Array, so you can `push`, `unshift`, `splice` and friends

    i++;
    if (i < limit) {


        tableOfMarkets.push(
            [market.symbol, market.price, percent(market.dailyChange)]
        );
    }

}

console.log(tableOfMarkets.toString());

/////////////////////////////////////////////////
// tableOfCoins
// from wallet
//

var tableOfCoins = new Table({
    head: ['Coin', 'Avail', 'Hold', 'Total', 'Value USD', 'Value BTC'],
    colWidths: [10, 20, 20, 20, 15, 20],
    colAligns: ['left', 'right', 'right', 'right', 'right', 'right']
});

let tot_usd = 0;
let tot_btc = 0;

for (let coin of myBalances) {
    let {
        currency,
        available,
        hold
    } = coin;
    let total = parseFloat(available) + parseFloat(hold);
    let val_usd = 0;
    let val_btc = 0;

    // USDT
    let sym_val_usd = currency + "_USDT";
    // does it exist in table?
    let market = marketsPrice.filter(m => m.symbol == sym_val_usd);
    if (market.length) {
        val_usd = parseFloat(market[0].price) * total
    };

    if (sym_val_usd == "USDT_USDT") {
        total = total.toFixed(2);
        val_usd = total
    };

    // BTC
    let sym_val_btc = currency + "_BTC";
    // does it exist in table?
    market = marketsPrice.filter(m => m.symbol == sym_val_btc);
    if (market.length) {
        val_btc = parseFloat(market[0].price) * total
    };
    if (sym_val_btc == "BTC_BTC") {
        val_btc = total
    };

    // put in table
    tableOfCoins.push([currency, available, hold, total, moneydollar(val_usd), moneybitcoin(val_btc)])

    // totals
    tot_usd += +val_usd;
    tot_btc += tot_btc + val_btc;
}

tableOfCoins.sort((a, b) => b[4] - a[4]);

tableOfCoins.push(['', '', '', 'TOTALS', moneydollar(tot_usd), moneybitcoin(tot_btc)]);

console.log(tableOfCoins.toString());

console.log("Load data=", LOADDATA);

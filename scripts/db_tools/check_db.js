const fetch = require('node-fetch');
const url = 'https://automation-suit-cece7-default-rtdb.firebaseio.com/users.json';
fetch(url).then(r => r.json()).then(data => {
  const keys = Object.keys(data).filter(k => k.toLowerCase().includes('dammam'));
  keys.forEach(k => console.log(k, JSON.stringify(data[k], null, 2)));
}).catch(console.error);

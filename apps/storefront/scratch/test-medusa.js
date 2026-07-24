const http = require('http');

const options = {
  hostname: 'localhost',
  port: 9000,
  path: '/store/products?fields=id,title,handle,thumbnail,*variants.calculated_price,*images,*options',
  method: 'GET',
  headers: {
    'x-publishable-api-key': 'pk_73dbbc8d591da6338b36da6ec5cc665eb7a4072fecdf45bfec023f7bb4324f46'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const products = JSON.parse(data).products;
    if (products && products.length > 0) {
      console.log(Object.keys(products[0]));
      console.log('Variants fields:', products[0].variants ? Object.keys(products[0].variants[0]) : 'None');
    } else {
      console.log('No products or error:', data);
    }
  });
});
req.on('error', (e) => { console.error(e); });
req.end();

import http from 'http';

const req = http.request('http://localhost:3000/api/estoque', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
});

req.write(JSON.stringify({
  item: 'CAIXA SEGMENTO - CM 2024',
  codigo: 'MC24I10001101',
  tipo: 'Entrada',
  quantidade: 5
}));
req.end();

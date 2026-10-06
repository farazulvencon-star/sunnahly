import 'dotenv/config';

async function test() {
  const payload = {
    name: "Test Update Product"
  };
  const res = await fetch('http://localhost:5000/api/products?id=eq.1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log(res.status, await res.text());
}
test();

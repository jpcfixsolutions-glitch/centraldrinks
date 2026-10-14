import fs from 'fs';
let content = fs.readFileSync('frontend/src/components/VentaMesa.jsx', 'utf-8');
content = content.replace("                  <div key={producto.uid", "                  return (\n                  <div key={producto.uid");
content = content.replace("                )}", "                );\n                })");
fs.writeFileSync('frontend/src/components/VentaMesa.jsx', content, 'utf-8');

import fs from 'fs';
let content = fs.readFileSync('frontend/src/components/VentaMesa.jsx', 'utf-8');
content = content.replace(/return \(\s*return \(/s, "return (");
fs.writeFileSync('frontend/src/components/VentaMesa.jsx', content, 'utf-8');

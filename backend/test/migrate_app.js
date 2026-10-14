import fs from 'fs';

let content = fs.readFileSync('frontend/src/App.jsx', 'utf-8');

if (!content.includes('import { CocinaView }')) {
    content = content.replace("import { VentaMesa } from './components/VentaMesa.jsx';", 
"import { VentaMesa } from './components/VentaMesa.jsx';\nimport { CocinaView } from './components/CocinaView.jsx';");
}

const cocinaRender = `
  } else if (vistaActual === 'cocina') {
    contenidoPrincipal = (
      <CocinaView 
        onVolver={() => setVistaActual('home')}
        sucursalId={sucursalId}
      />
    );
  } else if (vistaActual === 'stats') {`;

content = content.replace("  } else if (vistaActual === 'stats') {", cocinaRender);

fs.writeFileSync('frontend/src/App.jsx', content, 'utf-8');

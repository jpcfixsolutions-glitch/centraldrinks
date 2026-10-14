import fs from 'fs';

let content = fs.readFileSync('frontend/src/components/AppNav.jsx', 'utf-8');

// Add List icon to imports if not there
if (!content.includes('List,')) {
    content = content.replace('MapPin,', 'MapPin, List,');
}

// Add 'cocina' to extraItems
const extraItemsStr = `  const extraItems = [
    { id: 'cocina', label: 'Cocina', icon: List },
    { id: 'cuentas', label: 'Cuentas', icon: Wallet },`;

content = content.replace("  const extraItems = [\n    { id: 'cuentas', label: 'Cuentas', icon: Wallet },", extraItemsStr);

// Add to desktop sidebar
const desktopItem = `
          <NavButton active={active === 'cocina'} onClick={() => ir('cocina')} title="Cocina">
            <List className="w-5 h-5" />
          </NavButton>
          <NavButton active={active === 'cuentas'}`;

content = content.replace("<NavButton active={active === 'cuentas'}", desktopItem);

fs.writeFileSync('frontend/src/components/AppNav.jsx', content, 'utf-8');

import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/assets/images');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const assets = {
  'japi.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <circle cx="100" cy="100" r="90" fill="#FDE68A" stroke="#B45309" stroke-width="4"/>
    <!-- Concentric rings and woven cane pattern -->
    <circle cx="100" cy="100" r="70" fill="none" stroke="#D97706" stroke-width="3" stroke-dasharray="6,4"/>
    <circle cx="100" cy="100" r="50" fill="none" stroke="#B45309" stroke-width="3"/>
    <circle cx="100" cy="100" r="30" fill="none" stroke="#D97706" stroke-width="2" stroke-dasharray="4,3"/>
    <!-- Red and Green decorative felt patches (Bihu motifs) -->
    <path d="M100 20 L108 40 L92 40 Z" fill="#DC2626"/>
    <path d="M100 180 L108 160 L92 160 Z" fill="#DC2626"/>
    <path d="M20 100 L40 108 L40 92 Z" fill="#DC2626"/>
    <path d="M180 100 L160 108 L160 92 Z" fill="#DC2626"/>
    <polygon points="100,70 120,95 100,120 80,95" fill="#DC2626"/>
    <polygon points="100,80 112,95 100,110 88,95" fill="#15803D"/>
    <!-- Apex cone -->
    <circle cx="100" cy="100" r="14" fill="#991B1B" stroke="#B45309" stroke-width="2"/>
    <circle cx="100" cy="100" r="6" fill="#FDE68A"/>
  </svg>`,

  'xorai.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <!-- Base pedestal -->
    <ellipse cx="100" cy="175" rx="55" ry="12" fill="#CA8A04" stroke="#854D0E" stroke-width="3"/>
    <path d="M75 175 Q100 150 94 110 L106 110 Q100 150 125 175 Z" fill="#EAB308" stroke="#854D0E" stroke-width="2"/>
    <!-- Tray bowl -->
    <ellipse cx="100" cy="110" rx="75" ry="22" fill="#FACC15" stroke="#854D0E" stroke-width="3"/>
    <ellipse cx="100" cy="106" rx="65" ry="16" fill="#EAB308"/>
    <!-- Dome Cover (Xorai lid) -->
    <path d="M45 106 C45 60 70 40 100 35 C130 40 155 60 155 106 Z" fill="#FACC15" stroke="#854D0E" stroke-width="3"/>
    <!-- Crown Finial / Kalasa -->
    <path d="M96 35 L104 35 L106 18 L100 10 L94 18 Z" fill="#CA8A04" stroke="#854D0E" stroke-width="2"/>
    <circle cx="100" cy="10" r="4" fill="#DC2626"/>
    <!-- Decorative bands -->
    <line x1="55" y1="80" x2="145" y2="80" stroke="#854D0E" stroke-width="2" stroke-dasharray="5,4"/>
  </svg>`,

  'bihu_dhol.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <!-- Drum body -->
    <ellipse cx="100" cy="100" rx="42" ry="70" fill="#9A3412" stroke="#431407" stroke-width="3" transform="rotate(-20 100 100)"/>
    <!-- Left head -->
    <ellipse cx="50" cy="80" rx="20" ry="38" fill="#FDE047" stroke="#431407" stroke-width="3" transform="rotate(-20 50 80)"/>
    <!-- Right head -->
    <ellipse cx="150" cy="120" rx="20" ry="38" fill="#FDE047" stroke="#431407" stroke-width="3" transform="rotate(-20 150 120)"/>
    <!-- Leather cord tension braces -->
    <line x1="50" y1="50" x2="150" y2="90" stroke="#FEF08A" stroke-width="2"/>
    <line x1="50" y1="80" x2="150" y2="120" stroke="#FEF08A" stroke-width="2"/>
    <line x1="50" y1="110" x2="150" y2="150" stroke="#FEF08A" stroke-width="2"/>
    <!-- Red woven strap (Gamosa/Phool strap) -->
    <path d="M30 65 Q100 15 170 105" fill="none" stroke="#DC2626" stroke-width="7" stroke-linecap="round"/>
    <path d="M30 65 Q100 15 170 105" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4,4"/>
    <!-- Drumsticks (Kathi) -->
    <line x1="130" y1="50" x2="165" y2="105" stroke="#78350F" stroke-width="4" stroke-linecap="round"/>
  </svg>`,

  'pepa.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <!-- Buffalo Horn Pipe (Pepa) -->
    <!-- Carved bamboo mouthpiece & reed -->
    <rect x="25" y="140" width="35" height="12" rx="3" fill="#D97706" stroke="#78350F" stroke-width="2" transform="rotate(-30 25 140)"/>
    <!-- Black curved buffalo horn -->
    <path d="M45 130 Q100 120 140 70 Q160 45 175 40 Q160 80 125 130 Q90 160 45 130 Z" fill="#18181B" stroke="#09090B" stroke-width="3"/>
    <!-- Brass ring and horn rim decorations -->
    <ellipse cx="165" cy="50" rx="14" ry="24" fill="#EAB308" stroke="#854D0E" stroke-width="2" transform="rotate(45 165 50)"/>
    <circle cx="165" cy="50" r="8" fill="#18181B"/>
    <!-- Red decorative tassels -->
    <path d="M60 145 C60 165 55 175 52 185" stroke="#DC2626" stroke-width="3" stroke-linecap="round"/>
    <path d="M65 145 C65 165 68 175 70 185" stroke="#DC2626" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  'gamosa.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <!-- White woven cotton scarf with red floral phool -->
    <rect x="20" y="40" width="160" height="120" rx="8" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="2"/>
    <!-- Red borders (Anchu) -->
    <rect x="20" y="40" width="160" height="12" fill="#DC2626"/>
    <rect x="20" y="148" width="160" height="12" fill="#DC2626"/>
    <!-- Woven red floral motifs (Phool) -->
    <g fill="#DC2626">
      <path d="M145 65 L155 75 L145 85 L135 75 Z"/>
      <path d="M145 90 L155 100 L145 110 L135 100 Z"/>
      <path d="M145 115 L155 125 L145 135 L135 125 Z"/>
      <line x1="130" y1="55" x2="130" y2="145" stroke="#DC2626" stroke-width="3"/>
      <!-- Paisley / Magor / Lotus motif -->
      <circle cx="80" cy="100" r="14" fill="none" stroke="#DC2626" stroke-width="3"/>
      <path d="M80 80 Q95 100 80 120 Q65 100 80 80 Z"/>
    </g>
    <!-- Fringe / Tassels -->
    <line x1="180" y1="45" x2="195" y2="45" stroke="#DC2626" stroke-width="2"/>
    <line x1="180" y1="65" x2="195" y2="65" stroke="#E5E7EB" stroke-width="2"/>
    <line x1="180" y1="85" x2="195" y2="85" stroke="#DC2626" stroke-width="2"/>
    <line x1="180" y1="105" x2="195" y2="105" stroke="#E5E7EB" stroke-width="2"/>
    <line x1="180" y1="125" x2="195" y2="125" stroke="#DC2626" stroke-width="2"/>
    <line x1="180" y1="145" x2="195" y2="145" stroke="#DC2626" stroke-width="2"/>
  </svg>`,

  'tea_cup.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <!-- Hot Assam Morning Tea -->
    <!-- Saucer -->
    <ellipse cx="100" cy="165" rx="65" ry="14" fill="#E2E8F0" stroke="#94A3B8" stroke-width="3"/>
    <ellipse cx="100" cy="163" rx="45" ry="8" fill="#CBD5E1"/>
    <!-- Cup -->
    <path d="M55 85 Q58 145 100 145 Q142 145 145 85 Z" fill="#F8FAFC" stroke="#475569" stroke-width="3"/>
    <!-- Liquid tea -->
    <ellipse cx="100" cy="85" rx="45" ry="12" fill="#78350F" stroke="#475569" stroke-width="2"/>
    <ellipse cx="100" cy="85" rx="35" ry="8" fill="#9A3412"/>
    <!-- Cup Handle -->
    <path d="M142 95 Q170 100 165 125 Q160 140 135 135" fill="none" stroke="#475569" stroke-width="4"/>
    <!-- Steam wisps -->
    <path d="M85 65 Q95 45 85 25" fill="none" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    <path d="M105 70 Q115 50 105 30" fill="none" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    <path d="M125 65 Q135 45 125 35" fill="none" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  'walking_shoes.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <!-- Morning Walk: Walking stick & Shoes -->
    <!-- Walking Stick -->
    <path d="M40 30 C30 30 25 45 35 60 L80 180" fill="none" stroke="#78350F" stroke-width="7" stroke-linecap="round"/>
    <circle cx="80" cy="180" r="5" fill="#18181B"/>
    <!-- Walking Shoe -->
    <path d="M75 140 L100 115 L125 120 L155 145 L175 155 L175 170 L75 170 Z" fill="#0284C7" stroke="#0369A1" stroke-width="3"/>
    <rect x="70" y="165" width="110" height="12" rx="4" fill="#FFFFFF" stroke="#0369A1" stroke-width="2"/>
    <!-- Shoe laces -->
    <line x1="110" y1="125" x2="125" y2="135" stroke="#FFFFFF" stroke-width="3"/>
    <line x1="115" y1="135" x2="135" y2="145" stroke="#FFFFFF" stroke-width="3"/>
    <!-- Morning Sun icon in corner -->
    <circle cx="155" cy="45" r="16" fill="#FBBF24"/>
    <path d="M155 20 L155 25 M155 65 L155 70 M130 45 L135 45 M175 45 L180 45" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  'medicine_box.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <!-- Morning Medicine Strip & Glass of Water -->
    <!-- Blister pack pill strip -->
    <rect x="25" y="70" width="100" height="100" rx="8" fill="#E2E8F0" stroke="#64748B" stroke-width="3"/>
    <!-- Pills -->
    <circle cx="50" cy="95" r="12" fill="#EF4444" stroke="#B91C1C" stroke-width="2"/>
    <circle cx="100" cy="95" r="12" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2"/>
    <circle cx="50" cy="145" r="12" fill="#10B981" stroke="#047857" stroke-width="2"/>
    <circle cx="100" cy="145" r="12" fill="#F59E0B" stroke="#B45309" stroke-width="2"/>
    <!-- Glass of Water -->
    <path d="M135 60 L145 165 L175 165 L185 60 Z" fill="#E0F2FE" stroke="#0284C7" stroke-width="3"/>
    <path d="M140 100 L144 160 L176 160 L180 100 Z" fill="#38BDF8" opacity="0.6"/>
  </svg>`,

  'mem_ananya.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <rect width="200" height="200" rx="16" fill="#EFF6FF"/>
    <circle cx="100" cy="75" r="38" fill="#FCD34D"/>
    <!-- Hair -->
    <path d="M60 75 C60 35 140 35 140 75 C140 90 135 110 135 120 L125 105 L75 105 L65 120 Z" fill="#1E293B"/>
    <!-- Face details -->
    <circle cx="88" cy="75" r="4" fill="#0F172A"/>
    <circle cx="112" cy="75" r="4" fill="#0F172A"/>
    <path d="M92 90 Q100 100 108 90" fill="none" stroke="#DC2626" stroke-width="3" stroke-linecap="round"/>
    <!-- Body / Kurti -->
    <path d="M50 170 C50 130 75 120 100 120 C125 120 150 130 150 170 Z" fill="#0284C7"/>
    <!-- Scarf / Dupatta -->
    <path d="M70 120 L100 150 L130 120" fill="none" stroke="#F43F5E" stroke-width="8"/>
  </svg>`,

  'mem_bikram.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <rect width="200" height="200" rx="16" fill="#F0FDF4"/>
    <circle cx="100" cy="75" r="38" fill="#FDE68A"/>
    <!-- Hair & Moustache -->
    <path d="M65 65 C65 40 135 40 135 65 Z" fill="#1E293B"/>
    <circle cx="88" cy="75" r="4" fill="#0F172A"/>
    <circle cx="112" cy="75" r="4" fill="#0F172A"/>
    <!-- Classic Assamese Moustache -->
    <path d="M85 88 Q100 84 100 90 Q100 84 115 88" fill="none" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
    <!-- Shirt -->
    <path d="M45 170 C45 125 75 115 100 115 C125 115 155 125 155 170 Z" fill="#065F46"/>
    <!-- Collar -->
    <polygon points="100,135 85,115 115,115" fill="#FFFFFF"/>
  </svg>`,

  'mem_wife.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <rect width="200" height="200" rx="16" fill="#FFFBEB"/>
    <circle cx="100" cy="75" r="38" fill="#FCD34D"/>
    <!-- Bun / Kopou Phool hair -->
    <ellipse cx="100" cy="40" rx="20" ry="12" fill="#1E293B"/>
    <path d="M62 75 C62 38 138 38 138 75 C138 95 135 110 135 115 L65 115 Z" fill="#1E293B"/>
    <!-- Red Bindi on forehead -->
    <circle cx="100" cy="66" r="4" fill="#DC2626"/>
    <circle cx="88" cy="76" r="4" fill="#0F172A"/>
    <circle cx="112" cy="76" r="4" fill="#0F172A"/>
    <path d="M92 92 Q100 100 108 92" fill="none" stroke="#DC2626" stroke-width="3" stroke-linecap="round"/>
    <!-- Traditional Golden Muga Silk Sador with red border -->
    <path d="M45 170 C45 125 75 115 100 115 C125 115 155 125 155 170 Z" fill="#D97706"/>
    <path d="M60 120 L140 170" stroke="#DC2626" stroke-width="6"/>
  </svg>`,

  'mem_home.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <rect width="200" height="200" rx="16" fill="#FEF3C7"/>
    <!-- Betel nut palms (Tamol gas) -->
    <line x1="40" y1="180" x2="40" y2="40" stroke="#78350F" stroke-width="4"/>
    <path d="M40 40 Q20 30 15 45 M40 40 Q60 30 65 45 M40 40 Q35 15 40 10" stroke="#15803D" stroke-width="3" fill="none"/>
    <!-- Tin roof Assamese courtyard house -->
    <polygon points="70,90 125,55 180,90" fill="#94A3B8" stroke="#475569" stroke-width="3"/>
    <rect x="80" y="90" width="90" height="60" fill="#F8FAFC" stroke="#475569" stroke-width="3"/>
    <!-- Wooden door & windows -->
    <rect x="115" y="110" width="20" height="40" fill="#9A3412"/>
    <rect x="90" y="105" width="16" height="16" fill="#38BDF8" stroke="#475569" stroke-width="2"/>
    <rect x="145" y="105" width="16" height="16" fill="#38BDF8" stroke="#475569" stroke-width="2"/>
    <!-- Courtyard ground -->
    <rect x="0" y="150" width="200" height="50" fill="#BBF7D0"/>
  </svg>`
};

for (const [filename, content] of Object.entries(assets)) {
  fs.writeFileSync(path.join(outDir, filename), content.trim());
}

console.log(`Generated ${Object.keys(assets).length} regional cultural SVGs in ${outDir}`);

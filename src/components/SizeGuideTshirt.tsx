import { X, Ruler, Shirt, Droplets } from 'lucide-react';

// Specificaties en maattabel voor de Anthem Heavyweight T-Shirt (stijlcode
// AM015) — het T-shirt dat Cultheld gebruikt voor de legend-prints. Cijfers
// komen 1-op-1 uit de leverancier-specsheet en -maattabel (Anthem Product
// Specification 2026, Issue 1). Dit is bewust een los, herbruikbaar
// component: als er ooit een ander T-shirt-model bijkomt, kan dit gekopieerd
// worden i.p.v. hergebruikt met andere data erin geplakt.

interface SizeGuideTshirtProps {
  onClose: () => void;
}

// Lichaamsmaat (borstomvang) die bij elke maat past — dit is waar klanten
// naar kijken om hun eigen maat te bepalen.
const FIT_TABLE = [
  { size: 'XS', chestCm: '76 - 81' },
  { size: 'S', chestCm: '86 - 91' },
  { size: 'M', chestCm: '97 - 102' },
  { size: 'L', chestCm: '107 - 112' },
  { size: 'XL', chestCm: '117 - 122' },
  { size: 'XXL', chestCm: '127 - 132' },
  { size: '3XL', chestCm: '137 - 142' },
];

// Productafmetingen zoals plat gemeten op het kledingstuk zelf (fabrieksdata).
// Borstbreedte is de platte meting — x2 voor de omtrek.
const GARMENT_TABLE = [
  { size: 'XS', chest: 50.0, length: 66.0, sleeve: 19.5 },
  { size: 'S', chest: 53.0, length: 68.0, sleeve: 20.5 },
  { size: 'M', chest: 56.0, length: 70.0, sleeve: 21.5 },
  { size: 'L', chest: 59.0, length: 72.0, sleeve: 22.5 },
  { size: 'XL', chest: 62.5, length: 74.0, sleeve: 23.5 },
  { size: 'XXL', chest: 67.5, length: 77.0, sleeve: 24.5 },
  { size: '3XL', chest: 72.5, length: 80.0, sleeve: 25.5 },
];

// Kleuren uit de leverancier-specsheet. De hex-waardes zijn een indicatieve
// omzetting vanuit de opgegeven CMYK-referenties (stofkleuren wijken altijd
// iets af van een beeldscherm) — puur om de klant een idee te geven, niet
// bedoeld als exacte kleurmatch.
const COLOURS = [
  { name: 'Zwart', hex: '#3F3F35' },
  { name: 'Burgundy', hex: '#633A4C' },
  { name: 'Carbon', hex: '#363838' },
  { name: 'Charcoal', hex: '#615A5B' },
  { name: 'Eco Raw', hex: '#EBDBCF' },
  { name: 'Forest Green', hex: '#2E3D30' },
  { name: 'Grey Marl', hex: '#A29FA6' },
  { name: 'Khaki', hex: '#393D23' },
  { name: 'Lavender', hex: '#A399F7' },
  { name: 'Navy', hex: '#2B314F' },
  { name: 'Stone', hex: '#A4ADA6' },
  { name: 'Teal', hex: '#57BB9B' },
  { name: 'Wit', hex: '#FFFFFF' },
];

// Sfeerfoto's van het T-shirt — geleverd door Cultheld zelf (Anthem
// lookbook-fotografie), niet uit de leverancier-specsheet.
const PHOTOS = [
  { src: '/sizeguide/tshirt-1.webp', alt: 'Anthem Heavyweight T-Shirt sfeerfoto 1' },
  { src: '/sizeguide/tshirt-2.webp', alt: 'Anthem Heavyweight T-Shirt sfeerfoto 2' },
  { src: '/sizeguide/tshirt-3.webp', alt: 'Anthem Heavyweight T-Shirt sfeerfoto 3' },
];

export const SizeGuideTshirt = ({ onClose }: SizeGuideTshirtProps) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:w-full rounded-t-2xl sm:rounded-lg max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-gray-500 mb-1">
              STIJLCODE AM015
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Anthem Heavyweight T-Shirt</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 -mt-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Sluiten"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          <p className="text-gray-600 leading-relaxed">
            Van topkwaliteit: onze Anthem Heavyweight T-shirt is gemaakt van gecertificeerd
            organic ringspun garen voor een echte fashion-staple. Met 220gsm is dit een
            stevig, substantieel shirt met een retail-ready coupe.
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {PHOTOS.map((photo) => (
              <img
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="w-full aspect-[3/4] object-cover rounded-lg bg-gray-100"
              />
            ))}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Ruler size={18} />
              <h3 className="font-bold text-lg">Welke maat past bij mij?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Gebaseerd op je eigen borstomvang. Meet losjes om de breedste plek van je borst.
            </p>
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2 pr-4 font-semibold">Maat</th>
                    <th className="text-left py-2 font-semibold">Borstomvang (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {FIT_TABLE.map((row) => (
                    <tr key={row.size} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-semibold">{row.size}</td>
                      <td className="py-2 text-gray-700">{row.chestCm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-1">Productafmetingen</h3>
            <p className="text-sm text-gray-600 mb-4">
              Exacte afmetingen van het shirt zelf, plat gemeten. Borstbreedte x2 = omtrek.
            </p>
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2 pr-4 font-semibold">Maat</th>
                    <th className="text-left py-2 pr-4 font-semibold">Borstbreedte (cm)</th>
                    <th className="text-left py-2 pr-4 font-semibold">Rugengte (cm)</th>
                    <th className="text-left py-2 font-semibold">Mouwlengte (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {GARMENT_TABLE.map((row) => (
                    <tr key={row.size} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-semibold">{row.size}</td>
                      <td className="py-2 pr-4 text-gray-700">{row.chest.toFixed(1)}</td>
                      <td className="py-2 pr-4 text-gray-700">{row.length.toFixed(1)}</td>
                      <td className="py-2 text-gray-700">{row.sleeve.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">Tolerantie: ± 1 tot 2 cm per maat.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shirt size={18} />
                <h3 className="font-bold text-lg">Materiaal &amp; kenmerken</h3>
              </div>
              <ul className="text-sm text-gray-700 space-y-1.5">
                <li>Organic Blend Jersey, 220 gsm</li>
                <li>Effen kleuren: 100% ringspun gekamd organic katoen</li>
                <li>Marl-kleuren: 60% organic katoen, 40% gerecycled polyester</li>
                <li>Relaxed fit</li>
                <li>Gecertificeerd organic &amp; gecertificeerd gerecycled</li>
                <li>Geribde ronde hals</li>
                <li>Dubbele stiknaden</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Droplets size={18} />
                <h3 className="font-bold text-lg">Wasvoorschrift</h3>
              </div>
              <ul className="text-sm text-gray-700 space-y-1.5">
                <li>Machinewas max. 30°C</li>
                <li>Niet bleken</li>
                <li>Niet in de droger</li>
                <li>Strijken op lage temperatuur</li>
                <li>Chemisch reinigen toegestaan</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Beschikbare kleuren</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {COLOURS.map((colour) => (
                <div key={colour.name} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: colour.hex }}
                  />
                  <span className="text-xs text-gray-700 truncate">{colour.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Kleuren zijn indicatief — de daadwerkelijke kleur kan afwijken door je
              beeldscherminstellingen.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};

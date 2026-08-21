import { X, Ruler, Shirt, Droplets } from 'lucide-react';

// Specificaties en maattabel voor de Men's Anthem Hoodie (stijlcode AM001).
// Cijfers komen 1-op-1 uit de leverancier-specsheet en -maattabel (Anthem
// Product Specification 2026, Issue 1). Losstaand component, net als
// SizeGuideTshirt — bewust niet samengevoegd, zodat elk kledingstuk zijn
// eigen brondata houdt.

interface SizeGuideHoodieProps {
  onClose: () => void;
}

// Lichaamsmaat (borstomvang) die bij elke maat past. De hoodie wordt vanaf
// maat S verkocht (geen XS), conform de leverancierdata.
const FIT_TABLE = [
  { size: 'S', chestCm: '86 - 91' },
  { size: 'M', chestCm: '97 - 102' },
  { size: 'L', chestCm: '107 - 112' },
  { size: 'XL', chestCm: '117 - 122' },
  { size: 'XXL', chestCm: '127 - 132' },
  { size: '3XL', chestCm: '137 - 142' },
];

// Productafmetingen zoals plat gemeten op het kledingstuk zelf (fabrieksdata).
// Borstbreedte is de platte meting bij de oksel — x2 voor de omtrek.
const GARMENT_TABLE = [
  { size: 'S', length: 70.0, chest: 54.0, sleeve: 65.0 },
  { size: 'M', length: 72.0, chest: 58.0, sleeve: 66.0 },
  { size: 'L', length: 74.0, chest: 62.0, sleeve: 67.0 },
  { size: 'XL', length: 76.0, chest: 66.0, sleeve: 68.0 },
  { size: 'XXL', length: 78.0, chest: 70.0, sleeve: 69.0 },
  { size: '3XL', length: 80.0, chest: 74.0, sleeve: 70.0 },
];

// Kleuren uit de leverancier-specsheet. De hex-waardes zijn een indicatieve
// omzetting vanuit de opgegeven CMYK-referenties (stofkleuren wijken altijd
// iets af van een beeldscherm) — puur om de klant een idee te geven, niet
// bedoeld als exacte kleurmatch.
const COLOURS = [
  { name: 'Ash Grey', hex: '#E6E8E6' },
  { name: 'Zwart', hex: '#3F3F35' },
  { name: 'Burgundy', hex: '#633A4C' },
  { name: 'Charcoal', hex: '#615A5B' },
  { name: 'Desert Sand', hex: '#BF8A4E' },
  { name: 'Eco Raw', hex: '#EBDBCF' },
  { name: 'Forest Green', hex: '#2E3D30' },
  { name: 'Grey Marl', hex: '#A29FA6' },
  { name: 'Khaki', hex: '#393D23' },
  { name: 'Lavender', hex: '#A399F7' },
  { name: 'Light Blue', hex: '#9FB4D4' },
  { name: 'Navy', hex: '#2B314F' },
  { name: 'Oranje', hex: '#FA7A34' },
  { name: 'Oxford Navy', hex: '#2A2E42' },
  { name: 'Roze', hex: '#E6BCCC' },
  { name: 'Paars', hex: '#3D3C5C' },
  { name: 'Rood', hex: '#CC3541' },
  { name: 'Royal', hex: '#1B4D8C' },
  { name: 'Teal', hex: '#57BB9B' },
  { name: 'Wit', hex: '#FFFFFF' },
  { name: 'Geel', hex: '#F5D056' },
];

// Sfeerfoto's van de hoodie — geleverd door Cultheld zelf (Anthem
// lookbook-fotografie), niet uit de leverancier-specsheet.
const PHOTOS = [
  { src: '/sizeguide/hoodie-1.webp', alt: 'Anthem Heren Hoodie sfeerfoto 1' },
  { src: '/sizeguide/hoodie-2.webp', alt: 'Anthem Heren Hoodie sfeerfoto 2' },
  { src: '/sizeguide/hoodie-3.webp', alt: 'Anthem Heren Hoodie sfeerfoto 3' },
];

export const SizeGuideHoodie = ({ onClose }: SizeGuideHoodieProps) => {
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
              STIJLCODE AM001
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">Anthem Heren Hoodie</h2>
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
            Stuk vakwerk: de Anthem hoodie is heerlijk dik en heeft een zachte afwerking van
            binnen én buiten voor optimaal comfort. Elk detail is tot in de puntjes doordacht
            voor een hoodie met impact — draag 'm plain, of gebruik 'm als het perfecte canvas
            voor jouw eigen ontwerp.
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
              Exacte afmetingen van de hoodie zelf, plat gemeten. Borstbreedte x2 = omtrek.
            </p>
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2 pr-4 font-semibold">Maat</th>
                    <th className="text-left py-2 pr-4 font-semibold">Lengte (cm)</th>
                    <th className="text-left py-2 pr-4 font-semibold">Borstbreedte (cm)</th>
                    <th className="text-left py-2 font-semibold">Mouwlengte (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {GARMENT_TABLE.map((row) => (
                    <tr key={row.size} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-semibold">{row.size}</td>
                      <td className="py-2 pr-4 text-gray-700">{row.length.toFixed(1)}</td>
                      <td className="py-2 pr-4 text-gray-700">{row.chest.toFixed(1)}</td>
                      <td className="py-2 text-gray-700">{row.sleeve.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">Tolerantie: ± 1 cm per maat.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shirt size={18} />
                <h3 className="font-bold text-lg">Materiaal &amp; kenmerken</h3>
              </div>
              <ul className="text-sm text-gray-700 space-y-1.5">
                <li>Organic Blend Fleece, 320 gsm</li>
                <li>Effen kleuren: 80% organic katoen, 20% gerecycled polyester</li>
                <li>Grey Marl: 73% organic katoen, 21% gerecycled polyester, 6% viscose</li>
                <li>Ash Grey: 78% organic katoen, 21% gerecycled polyester, 1% viscose</li>
                <li>Slim fit</li>
                <li>Gecertificeerd organic &amp; gecertificeerd gerecycled</li>
                <li>Wafelstructuur capuchon</li>
                <li>Geborstelde fleece binnenzijde</li>
                <li>Nikkelvrije ogen en koordstoppers</li>
                <li>Dubbele stiknaden</li>
                <li>Geribde boorden en zoom</li>
                <li>Kangoeroezak</li>
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

import { Link } from '../lib/router';

export const Footer = () => {
  return (
    <footer className="bg-black text-white border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img
              src="/logo-ch.png"
              alt="Cultheld - We all love football"
              className="h-32 w-auto mb-4 invert"
            />
            <p className="text-gray-400 text-sm">
              Draag jouw cultheld. Premium voetbal merchandise met de grootste legends.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/seizoenen" className="hover:text-white transition-colors">
                  Eredivisie Seizoenen
                </Link>
              </li>
              <li>
                <Link to="/legends" className="hover:text-white transition-colors">
                  Wereldlegends
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Klantenservice</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/track-order" className="hover:text-white transition-colors">
                  Volg Je Bestelling
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Veelgestelde Vragen
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Info</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Over Cultheld
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Algemene Voorwaarden
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Cultheld.nl. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
};

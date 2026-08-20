import { useEffect, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Legend } from '../lib/types';
import { useSEO, breadcrumbJsonLd } from '../lib/seo';

export const Legends = () => {
  const { navigate } = useRouter();
  const [legends, setLegends] = useState<Legend[]>([]);
  const [filteredLegends, setFilteredLegends] = useState<Legend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useSEO({
    title: 'Wereldlegends shirts',
    description: 'Kies uit de grootste voetballegendes ter wereld en zet jouw favoriet op een premium t-shirt, hoodie of sweater bij Cultheld.',
    path: '/legends',
    jsonLd: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Wereldlegends', path: '/legends' },
    ]),
  });

  useEffect(() => {
    loadLegends();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = legends.filter((legend) =>
        legend.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLegends(filtered);
    } else {
      setFilteredLegends(legends);
    }
  }, [searchQuery, legends]);

  const loadLegends = async () => {
    const { data, error } = await supabase
      .from('legends')
      .select('*')
      .eq('category', 'world')
      .order('name');

    if (!error && data) {
      setLegends(data);
      setFilteredLegends(data);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Wereldlegends</h1>
          <p className="text-xl text-gray-600">
            De grootste voetbaliconen aller tijden op premium merchandise
          </p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search
              size={20}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Zoek een legend..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : filteredLegends.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600">
              {searchQuery
                ? 'Geen legends gevonden voor je zoekopdracht'
                : 'Geen legends beschikbaar'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLegends.map((legend) => (
              <button
                key={legend.id}
                onClick={() => navigate(`/legend/${legend.slug}`)}
                className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={legend.png_url}
                    alt={legend.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{legend.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {legend.bio || 'Voetballegende'}
                  </p>
                  <div className="flex items-center gap-2 text-black font-semibold group-hover:gap-3 transition-all">
                    Bekijk producten
                    <ArrowRight size={16} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

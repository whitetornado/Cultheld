import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Season } from '../lib/types';
import { useSEO, breadcrumbJsonLd } from '../lib/seo';

export const Seasons = () => {
  const { navigate } = useRouter();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Eredivisie seizoenen',
    description: 'Bekijk alle Eredivisie-seizoenen bij Cultheld en kies per seizoen een club en cultheld om op een premium t-shirt, hoodie of sweater te zetten.',
    path: '/seizoenen',
    jsonLd: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Seizoenen', path: '/seizoenen' },
    ]),
  });

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .order('start_year', { ascending: false });

    if (!error && data) {
      // Sort seasons: active season first, then by start_year descending
      const sortedSeasons = data.sort((a, b) => {
        // Active season comes first
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        // Then sort by start_year descending (newest first)
        return b.start_year - a.start_year;
      });
      setSeasons(sortedSeasons);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Eredivisie Seizoenen</h1>
          <p className="text-xl text-gray-600">
            Kies het seizoen van jouw favoriete voetbalmoment
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : seasons.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600">Geen seizoenen beschikbaar</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => navigate(`/seizoen/${season.start_year}-${season.end_year}`)}
                className="group bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-black transition-all hover:shadow-lg text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-4xl font-bold mb-2">{season.name}</div>
                    <div className="text-gray-600">Eredivisie</div>
                  </div>
                  {season.is_active && (
                    <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      Actief
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-black font-semibold group-hover:gap-3 transition-all">
                  Bekijk clubs
                  <ArrowRight size={16} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

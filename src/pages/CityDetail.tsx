import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Club, Legend } from '../lib/types';
import { useSEO, breadcrumbJsonLd } from '../lib/seo';
import { slugify } from '../lib/slug';

type LegendWithClub = Legend & { club?: Club };

// Aggregates the all-time legends of every club in one city (e.g. Rotterdam
// has both Sparta and Excelsior) onto a single, season-independent page.
export const CityDetail = () => {
  const { navigate, params } = useRouter();
  const [cityName, setCityName] = useState<string | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [legends, setLegends] = useState<LegendWithClub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.citySlug) {
      loadCity();
    }
  }, [params.citySlug]);

  const loadCity = async () => {
    const { data: allClubs } = await supabase
      .from('clubs')
      .select('*')
      .not('city', 'is', null);

    const matchingClubs = (allClubs || []).filter(
      (c) => c.city && slugify(c.city) === params.citySlug
    );

    if (matchingClubs.length > 0) {
      setCityName(matchingClubs[0].city);
      setClubs(matchingClubs);

      const clubIds = matchingClubs.map((c) => c.id);
      const { data: legendsData } = await supabase
        .from('legends')
        .select('*')
        .in('club_id', clubIds)
        .eq('all_time', true)
        .order('name');

      if (legendsData) {
        setLegends(
          legendsData.map((l) => ({
            ...l,
            club: matchingClubs.find((c) => c.id === l.club_id),
          }))
        );
      }
    }

    setLoading(false);
  };

  const path = `/stad/${params.citySlug || ''}`;
  const clubNames = clubs.map((c) => c.name);

  useSEO({
    title: cityName
      ? `Voetbalshirt kopen ${cityName} – all-time culthelden`
      : 'Stad',
    description: cityName
      ? `Alle all-time culthelden uit ${cityName} op een rij${clubNames.length ? ` (${clubNames.join(', ')})` : ''}. Kies jouw favoriete legende en zet 'm op een premium shirt, hoodie of sweater.`
      : 'Culthelden per stad bij Cultheld.',
    path,
    noindex: !loading && (!cityName || legends.length === 0),
    jsonLd: cityName
      ? [
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: cityName, path },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `Culthelden uit ${cityName}`,
            description: `All-time culthelden uit ${cityName} om op een shirt te zetten.`,
            about: { '@type': 'City', name: cityName },
          },
        ]
      : undefined,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!cityName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Stad niet gevonden</h1>
          <button
            onClick={() => navigate('/seizoenen')}
            className="text-black hover:underline"
          >
            Terug naar seizoenen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/seizoenen')}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          Terug naar seizoenen
        </button>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Culthelden uit {cityName}
          </h1>
          <p className="text-xl text-gray-600">
            Clubs:{' '}
            {clubs.map((c, i) => (
              <span key={c.id}>
                <button
                  onClick={() => navigate(`/club/${c.slug}`)}
                  className="underline hover:text-black"
                >
                  {c.name}
                </button>
                {i < clubs.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>

        {legends.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600">
              Nog geen all-time culthelden ingesteld voor {cityName}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {legends.map((legend) => (
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
                  <h3 className="text-xl font-bold mb-1">{legend.name}</h3>
                  {legend.club && (
                    <p className="text-sm text-gray-500 mb-2">{legend.club.name}</p>
                  )}
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {legend.bio || 'Bekijk dit cultheld'}
                  </p>
                  <div className="flex items-center gap-2 text-black font-semibold group-hover:gap-3 transition-all">
                    Kies deze held
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

import { useEffect, useState } from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Club, Legend } from '../lib/types';
import { useSEO, breadcrumbJsonLd } from '../lib/seo';
import { slugify } from '../lib/slug';

// Season-independent club page: shows the legends marked "all-time" for
// this club, regardless of which season(s) they were actually assigned to.
// Complements SeasonDetail -> ClubDetail (which stays scoped to one season).
export const ClubAllTime = () => {
  const { navigate, params } = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [legends, setLegends] = useState<Legend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.clubSlug) {
      loadClub();
    }
  }, [params.clubSlug]);

  const loadClub = async () => {
    const { data: clubData } = await supabase
      .from('clubs')
      .select('*')
      .eq('slug', params.clubSlug)
      .single();

    if (clubData) {
      setClub(clubData);

      const { data: legendsData } = await supabase
        .from('legends')
        .select('*')
        .eq('club_id', clubData.id)
        .eq('all_time', true)
        .order('name');

      if (legendsData) {
        setLegends(legendsData);
      }
    }

    setLoading(false);
  };

  const cityLabel = club?.city ? ` ${club.city}` : '';
  const path = `/club/${params.clubSlug || ''}`;

  useSEO({
    title: club
      ? `${club.name} all-time shirt kopen${cityLabel ? ` – ${club.city}` : ''}`
      : 'Club',
    description: club
      ? `De all-time culthelden van ${club.name}${cityLabel}, los van seizoen. Kies jouw favoriete legende en druk 'm op een premium t-shirt, hoodie of sweater.`
      : 'Voetbalshirt met jouw favoriete cultheld erop, bij Cultheld.',
    path,
    image: club?.logo_url || undefined,
    noindex: !loading && (!club || legends.length === 0),
    jsonLd: club
      ? [
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            ...(club.city
              ? [{ name: club.city, path: `/stad/${slugify(club.city)}` }]
              : []),
            { name: club.name, path },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${club.name} all-time culthelden${cityLabel}`,
            description: `All-time culthelden van ${club.name}${cityLabel} om op een shirt te zetten.`,
            ...(club.city ? { about: { '@type': 'City', name: club.city } } : {}),
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

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Niet gevonden</h1>
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

        <div className="mb-12 flex items-center gap-6">
          {club.logo_url && (
            <div className="w-24 h-24 flex-shrink-0">
              <img
                src={club.logo_url}
                alt={club.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{club.name}</h1>
            <p className="text-xl text-gray-600">
              All-time culthelden
              {club.city && (
                <>
                  {' · '}
                  <button
                    onClick={() => navigate(`/stad/${slugify(club.city!)}`)}
                    className="underline hover:text-black"
                  >
                    {club.city}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {legends.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600">
              Nog geen all-time culthelden ingesteld voor {club.name}
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">Culthelden</h2>
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
                    <h3 className="text-xl font-bold mb-2">{legend.name}</h3>
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
          </>
        )}
      </div>
    </div>
  );
};

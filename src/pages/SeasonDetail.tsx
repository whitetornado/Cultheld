import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Season, Club } from '../lib/types';
import { useSEO, breadcrumbJsonLd } from '../lib/seo';

export const SeasonDetail = () => {
  const { navigate, params } = useRouter();
  const [season, setSeason] = useState<Season | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.seasonSlug) {
      loadSeasonAndClubs();
    }
  }, [params.seasonSlug]);

  const loadSeasonAndClubs = async () => {
    const [startYear, endYear] = params.seasonSlug.split('-');

    const { data: seasonData } = await supabase
      .from('seasons')
      .select('*')
      .eq('start_year', parseInt(startYear))
      .eq('end_year', parseInt(endYear))
      .single();

    if (seasonData) {
      setSeason(seasonData);

      const { data: assignmentsData } = await supabase
        .from('legend_assignments')
        .select('club_id')
        .eq('season_id', seasonData.id);

      const clubIds = [...new Set(assignmentsData?.map((a) => a.club_id) || [])];

      if (clubIds.length > 0) {
        const { data: clubsData } = await supabase
          .from('clubs')
          .select('*')
          .in('id', clubIds)
          .order('name');

        if (clubsData) {
          setClubs(clubsData);
        }
      } else {
        const { data: allClubs } = await supabase.from('clubs').select('*').order('name');
        if (allClubs) setClubs(allClubs);
      }
    }

    setLoading(false);
  };

  const path = `/seizoen/${params.seasonSlug || ''}`;
  const cityNames = [...new Set(clubs.map((c) => c.city).filter(Boolean))] as string[];

  useSEO({
    title: season ? `Eredivisie shirts seizoen ${season.name}` : 'Seizoen',
    description: season
      ? `Kies een Eredivisie-club uit seizoen ${season.name}${cityNames.length ? ` (o.a. ${cityNames.slice(0, 5).join(', ')})` : ''} en zet jouw favoriete cultheld op een premium shirt, hoodie of sweater.`
      : 'Bekijk de Eredivisie-clubs per seizoen bij Cultheld.',
    path,
    noindex: !loading && !season,
    jsonLd: season ? breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Seizoenen', path: '/seizoenen' },
      { name: season.name, path },
    ]) : undefined,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Seizoen niet gevonden</h1>
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
            Eredivisie {season.name}
          </h1>
          <p className="text-xl text-gray-600">
            Kies jouw club en ontdek de culthelden van dit seizoen
          </p>
        </div>

        {clubs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600">Nog geen clubs beschikbaar voor dit seizoen</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {clubs.map((club) => (
              <button
                key={club.id}
                onClick={() =>
                  navigate(`/seizoen/${params.seasonSlug}/club/${club.slug}`)
                }
                className="group bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-black transition-all hover:shadow-lg"
              >
                <div className="aspect-square mb-4 flex items-center justify-center">
                  {club.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt={club.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-400">
                        {club.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold mb-2">{club.name}</h3>
                  <div className="flex items-center justify-center gap-1 text-sm text-black font-medium group-hover:gap-2 transition-all">
                    Bekijk helden
                    <ArrowRight size={14} />
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

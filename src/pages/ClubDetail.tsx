import { useEffect, useState } from 'react';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { useRouter } from '../lib/router';
import { supabase } from '../lib/supabase';
import { Season, Club, Legend, LegendAssignment } from '../lib/types';

export const ClubDetail = () => {
  const { navigate, params } = useRouter();
  const [season, setSeason] = useState<Season | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [legends, setLegends] = useState<Legend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.seasonSlug && params.clubSlug) {
      loadClubLegends();
    }
  }, [params.seasonSlug, params.clubSlug]);

  const loadClubLegends = async () => {
    const [startYear, endYear] = params.seasonSlug.split('-');

    const { data: seasonData } = await supabase
      .from('seasons')
      .select('*')
      .eq('start_year', parseInt(startYear))
      .eq('end_year', parseInt(endYear))
      .single();

    const { data: clubData } = await supabase
      .from('clubs')
      .select('*')
      .eq('slug', params.clubSlug)
      .single();

    if (seasonData && clubData) {
      setSeason(seasonData);
      setClub(clubData);

      const { data: assignments } = await supabase
        .from('legend_assignments')
        .select('legend_id')
        .eq('season_id', seasonData.id)
        .eq('club_id', clubData.id);

      if (assignments && assignments.length > 0) {
        const legendIds = assignments.map((a) => a.legend_id);
        const { data: legendsData } = await supabase
          .from('legends')
          .select('*')
          .in('id', legendIds);

        if (legendsData) {
          setLegends(legendsData);
        }
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!season || !club) {
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
          onClick={() => navigate(`/seizoen/${params.seasonSlug}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          Terug naar clubs
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
            <p className="text-xl text-gray-600">Seizoen {season.name}</p>
          </div>
        </div>

        {legends.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600">
              Nog geen culthelden beschikbaar voor deze club in dit seizoen
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
